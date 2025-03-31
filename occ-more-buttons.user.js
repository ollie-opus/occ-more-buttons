// ==UserScript==
// @name         occ-more-buttons
// @namespace    http://tampermonkey.net/
// @version      1.0.10
// @description  Adds more Buttons. So far: Set as manager, Set as user, Clear checkboxes and Generate QR poster.
// @author       Ollie
// @match        https://cloud.opus-safety.co.uk/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cloud.opus-safety.co.uk
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
// @downloadURL  https://github.com/ollie-opus/occ-more-buttons/raw/refs/heads/main/occ-more-buttons.user.js
// @updateURL    https://github.com/ollie-opus/occ-more-buttons/raw/refs/heads/main/occ-more-buttons.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...

    // 1st ORDER FUNCTIONS

    function clearAllCheckboxes() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    }

    function selectManager() {
        // Select the <select> element
        var selectElement = document.querySelector('.form-input.form-select');

        // Change the value
        selectElement.value = "manager";

        // Trigger the change event manually
        var event = new Event('change', {
            'bubbles': true, // Event will bubble up through the DOM
            'cancelable': true // Allow the event to be canceled
        });
        selectElement.dispatchEvent(event);
    }

    function selectUser() {
        // Select the <select> element
        var selectElement = document.querySelector('.form-input.form-select');

        // Change the value
        selectElement.value = "user";

        // Trigger the change event manually
        var event = new Event('change', {
            'bubbles': true, // Event will bubble up through the DOM
            'cancelable': true // Allow the event to be canceled
        });
        selectElement.dispatchEvent(event);
    }

    function submitAccessForm() {
        const submit = document.querySelector('form[data-controller="employees--site-access"]');
        submit.requestSubmit(); // Submit the form programmatically
    }

    function siteQRConfirmationAndNavigation() {
        let siteQRConfirmAction = confirm("Are you sure you want to create a new QR poster?\nPlease also test to see if the generated QR poster works before sharing.");
        if (!siteQRConfirmAction) return;

        sessionStorage.setItem("triggerQRPDF", "true"); // Flag to run script on next page load

        let sitePath = window.location.pathname;
        let match = sitePath.match(/\/sites\/([a-f0-9\-]{36})/); // Regex to match the UUID format
        if (match) {
            let siteuuid = match[1]; // UUID is captured in the first group
            let qrPageUrl = window.location.origin + '/admin/sites/' + siteuuid + '/qrs/new?more_buttons_automation_3ee255f7';
            window.location.href = qrPageUrl;
        } else {
            alert("Could not find site UUID in the URL.");
        }
    }

    function populateSiteQRNameInput() {
        let inputSiteQRNameField = document.getElementById('site_qr_name');
        if (inputSiteQRNameField) {
            inputSiteQRNameField.value = 'QR Poster (made via automation)';
        }
    }

    function submitGenericForm() {
        const submit = document.querySelector('form[data-controller="form"]');
        submit.requestSubmit(); // Submit the form programmatically
    } // This can be used to submit QR name form

    function loadJsPDF(callback) {
        let script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = callback;
        document.body.appendChild(script);
    } // Load jsPDF dynamically

    function scrapeSiteName() {
        let element = document.querySelector(".site-select__current-label");
        return element ? element.textContent.trim() : "Unknown Site"; // Fallback if element is not found
    }

    function generatePDF(qrCodeDataUrl) {
        // Wait for jsPDF to be ready
        if (typeof window.jspdf === "undefined") {
            console.error("jsPDF not loaded yet!");
            return;
        }

        const { jsPDF } = window.jspdf;
        let doc = new jsPDF();

        // GitHub-hosted assets
        let templateImg = "https://raw.githubusercontent.com/ollie-opus/occ-more-buttons/main/siteqrtemplate.png";
        let fontUrl = "https://raw.githubusercontent.com/ollie-opus/occ-more-buttons/main/Outfit-Bold.ttf";

        let siteName = scrapeSiteName();

        // Function to load and register the font
        async function loadFont(url) {
            const response = await fetch(url);
            const fontBlob = await response.blob();
            const reader = new FileReader();

            return new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result.split(",")[1]); // Extract Base64
                reader.readAsDataURL(fontBlob);
            });
        }

        // Load the font, then generate the PDF
        loadFont(fontUrl).then((fontBase64) => {
            doc.addFileToVFS("Outfit-Bold.ttf", fontBase64);
            doc.addFont("Outfit-Bold.ttf", "Outfit", "bold");
            doc.setFont("Outfit", "bold"); // Use Outfit font

            doc.addImage(templateImg, "PNG", 0, 0, 210, 297);
            doc.addImage(qrCodeDataUrl, "PNG", 57.5, 101, 95, 95);

            // Add site name with Outfit font
            doc.setTextColor("#002e72");
            doc.setFontSize(20);
            doc.text(siteName, 105, 88, { align: "center" });

            doc.save(`${siteName} QR Poster.pdf`);
        }).catch(error => {
            console.error("Failed to load font:", error);
        });
    }

    function transformURLForQRCode(currentURL) {
        let match = currentURL.match(/\/qrs\/([a-f0-9\-]+)$/);
        if (match) {
            return `https://cloud.opus-safety.co.uk/qrs/${match[1]}`;
        }
        return null; // Return null if no match found
    }

    // 2nd ORDER FUNCTIONS

    function addManagerButton() {
        if (document.getElementById('setManagerButton')) return;

        let button = document.createElement('button');
        button.id = 'setManagerButton';
        button.innerText = 'Set as manager';
        button.title = 'Set this employee as a manager';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '310px';
        button.style.padding = '9px 13px';
        button.style.backgroundColor = '#0064e3';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontWeight = '500';
        button.style.fontFamily = 'RubikVariable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji';
        button.style.fontSize = '.875rem';

        button.addEventListener('click', function() {
            selectManager();
            submitAccessForm();
        });

        document.body.appendChild(button);
    }

    function addUserButton() {
        if (document.getElementById('setUserButton')) return;

        let button = document.createElement('button');
        button.id = 'setUserButton';
        button.innerText = 'Set as user';
        button.title = 'Set this employee as a user';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '210px';
        button.style.padding = '9px 13px';
        button.style.backgroundColor = '#0064e3';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontWeight = '500';
        button.style.fontFamily = 'RubikVariable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji';
        button.style.fontSize = '.875rem';

        button.addEventListener('click', function() {
            selectUser();
            submitAccessForm();
        });

        document.body.appendChild(button);
    }

    function addCheckboxButton() {
        if (document.getElementById('clearCheckboxes')) return;

        let button = document.createElement('button');
        button.id = 'clearCheckboxes';
        button.innerText = 'Clear checkboxes';
        button.title = 'Clear all checkbox fields on this page';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '70px';
        button.style.padding = '9px 13px';
        button.style.backgroundColor = '#dc2626';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontWeight = '500';
        button.style.fontFamily = 'RubikVariable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji';
        button.style.fontSize = '.875rem';

        button.addEventListener('click', function() {
            clearAllCheckboxes();
        });

        document.body.appendChild(button);
    }

    function generateQRCodeForTransformedURL(currentURL, callback) {
        // Transform the URL for the QR code
        let transformedURL = transformURLForQRCode(currentURL);

        // If the transformation is successful, proceed with generating the QR code
        if (transformedURL) {
            let qrContainer = document.createElement('div');
            qrContainer.style.display = 'none';
            document.body.appendChild(qrContainer);

            let qr = new QRCode(qrContainer, {
                text: transformedURL,
                width: 400,
                height: 400
            });

            setTimeout(() => {
                let qrCanvas = qrContainer.querySelector('canvas');
                let qrDataUrl = qrCanvas.toDataURL('image/png');
                qrContainer.remove();
                callback(qrDataUrl); // Return the generated QR code data URL
            }, 500);
        } else {
            console.error('Invalid URL for QR Code transformation');
        }
    }

    function addGenerateSiteQRPosterButton() {
        if (document.getElementById('generateSiteQRPoster')) return;

        let button = document.createElement('button');
        button.id = 'generateSiteQRPoster';
        button.innerText = 'Generate QR poster';
        button.title = 'Generate a new QR code and poster for this site/asset/employee';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '70px';
        button.style.padding = '9px 13px';
        button.style.backgroundColor = '#db2777';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontWeight = '500';
        button.style.fontFamily = 'RubikVariable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji';
        button.style.fontSize = '.875rem';

        button.addEventListener('click', function() {
            siteQRConfirmationAndNavigation();
        });

        document.body.appendChild(button);
    }

    // 3rd ORDER FUNCTIONS

    function handleEditPageFilter() {
        if (window.location.href.includes("/edit")) {
            setTimeout(() => {
                addCheckboxButton(); // Trigger addButton
                // add more triggers if needed
            }, 1000);
        } else {
            return; // If URL doesn't match, stop the script
        }
    }

    function handleAccessPageFilter() {
        if (window.location.href.includes("access/edit")) {
            setTimeout(() => {
                addManagerButton(); // Trigger addButton
                addUserButton(); // Trigger addButton
            }, 1000);
        } else {
            return; // If URL doesn't match, stop the script
        }
    }

    function handleQRPageFilter() {
        const urlPattern = /^https:\/\/cloud\.opus-safety\.co\.uk\/admin\/sites\/[a-f0-9-]+\/qrs$/;

        if (urlPattern.test(window.location.href)) {
            setTimeout(() => {
                addGenerateSiteQRPosterButton(); // Trigger addButton
                // add more buttons if needed
            }, 1000);
        }
        if (window.location.href.includes('more_buttons_automation_3ee255f7')) {
            setTimeout(() => {
                populateSiteQRNameInput();
                submitGenericForm();
            }, 1000);
        }
        if (window.location.href.match(/\/admin\/sites\/[^/]+\/qrs\/[0-9a-fA-F-]{36}$/)) {
            if (sessionStorage.getItem("triggerQRPDF") === "true") {
                sessionStorage.removeItem("triggerQRPDF"); // Remove flag to prevent repeat execution
                loadJsPDF();
                let currentURL = window.location.href;
                generateQRCodeForTransformedURL(currentURL, generatePDF)
            }
        }
    }



    // 4th ORDER FUNCTIONS

    function executescript() {
        // Function to run your filters
        function runFilters() {
            handleAccessPageFilter();
            handleEditPageFilter();
            handleQRPageFilter();
        }

        // Intercept pushState and replaceState for SPA URL changes
        (function(history) {
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;

            // Function to trigger filters on URL change
            function onUrlChange() {
                runFilters();
            }

            // Override pushState to detect SPA navigation
            history.pushState = function() {
                originalPushState.apply(history, arguments);
                onUrlChange();
            };

            // Override replaceState to detect SPA navigation
            history.replaceState = function() {
                originalReplaceState.apply(history, arguments);
                onUrlChange();
            };

            // Listen for back/forward navigation (popstate event)
            window.addEventListener("popstate", onUrlChange);
        })(window.history);

        // Run filters immediately for the initial page load
        runFilters();
    }

    // EXECUTION
    executescript();

})();
