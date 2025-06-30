// ==UserScript==
// @name         occ-more-buttons
// @namespace    http://tampermonkey.net/
// @version      1.1.9
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

    function auditCSVExport() {

        // Select all <li> elements with both specific data attributes
        const questionBlocks = document.querySelectorAll('li[data-collapse-target="content"][data-reorderable-group="question"]');

        // Define CSV header
        let csvRows = [
            ['Section', 'Question', 'Weighting', 'Question Type', 'Audit Action Severity', 'Audit Action Title']
        ];

        questionBlocks.forEach(block => {
            const section_number = block.querySelector('input[name$="[section]"]')?.value || '';
            const section = document.getElementById(`section-${section_number}-name`)?.value || '';
            const question = block.querySelector('input[name$="[title]"]')?.value || '';
            const weighting = block.querySelector('input[name$="[weight]"]')?.value || '';
            const question_type = block.querySelector('input[name$="[type]"]')?.value || '';
            const audit_action_severity = block.querySelector('select[name$="[todo_severity]"]')?.value || '';
            const audit_action_title = block.querySelector('input[name$="[todo_title]"]')?.value || '';

            const row = [section, question, weighting, question_type, audit_action_severity, audit_action_title];

            // Audit Header (Other Information) exclusion rule
            if (section === "Other information") {
                return
            }

            // Only include the row if at least one field is not empty
            if (row.some(cell => cell.trim() !== '')) {
                csvRows.push(row);
            }
        });

        // Convert rows to CSV string
        const csvContent = csvRows
        .map(row => row.map(cell =>`"${cell.replace(/\r?\n|\r/g, ' ').replace(/"/g, '""')}"`).join(',')).join('\n');


        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const rawTitle = document.getElementById('page-title')?.textContent.trim() || '';
        const cleanedTitle = rawTitle.replace(/^Edit\s+/i, '');
        link.href = URL.createObjectURL(blob);
        link.download = `${cleanedTitle} data-export.csv`;
        link.click();

    }

    function annualDocumentDefault() {
        document.getElementById('document_scope').value = 'anonymous';
        document.getElementById('document_measurement_reminder_severity').value = 'minor';
        document.getElementById('document_measurement_reminder_interval').value = 'P1Y';
        document.getElementById('document_measurement_reminder_lead_time').value = 'P14D';
    }

    function navigateToNewDocumentPage(type) {
        const sitePath = window.location.pathname;
        const match = sitePath.match(/\/sites\/([a-f0-9\-]{36})/); // Regex to match the UUID format

        if (match) {
            const siteuuid = match[1]; // UUID is captured in the first group
            let documentPageUrl;

            if (type === 'employee') {
                documentPageUrl = `${window.location.origin}/admin/sites/${siteuuid}/templates/documents/new?data_type=pdf&filter_type=employee_role&more_buttons_automation_7dca63d3`;
            } else if (type === 'asset') {
                documentPageUrl = `${window.location.origin}/admin/sites/${siteuuid}/templates/documents/new?data_type=pdf&filter_type=asset_role&more_buttons_automation_c6e56e7f`;
            } else {
                alert("Invalid document page type specified.");
                return;
            }

            window.location.href = documentPageUrl;
        } else {
            alert("Could not find site UUID in the URL.");
        }
    }

    function navigateToNewEmployeePage() {

        let sitePath = window.location.pathname;
        let match = sitePath.match(/\/sites\/([a-f0-9\-]{36})/); // Regex to match the UUID format
        if (match) {
            let siteuuid = match[1]; // UUID is captured in the first group
            let trainingPageUrl = window.location.origin + '/admin/sites/' + siteuuid + '/employees/new?more_buttons_automation_7dca63d3';
            window.location.href = trainingPageUrl;
        } else {
            alert("Could not find site UUID in the URL.");
        }
    }

    function navigateToRolePage(type) {
        const sitePath = window.location.pathname;
        const match = sitePath.match(/\/sites\/([a-f0-9\-]{36})/); // Regex to match the UUID format

        if (match) {
            const siteuuid = match[1]; // UUID is captured in the first group
            let rolePageUrl;

            if (type === 'employee') {
                rolePageUrl = `${window.location.origin}/admin/sites/${siteuuid}/employees/roles`;
            } else if (type === 'asset') {
                rolePageUrl = `${window.location.origin}/admin/sites/${siteuuid}/equipments/asset-types`;
            } else {
                alert("Invalid role page type specified.");
                return;
            }

            window.location.href = rolePageUrl;
        } else {
            alert("Could not find site UUID in the URL.");
        }
    }

    function copyChecklistQuestions() {
        // open the details element
        document.querySelector('details[aria-labelledby="questions-section-title"]').open = true;

        //open potential sections
        document.querySelectorAll('button[data-collapse-target="trigger"][aria-expanded="false"]').forEach(button => {
            button.click();
        });

        // Get the page title
        const titleElement = document.querySelector('#page-title');
        let pageTitle = titleElement ? titleElement.innerText.trim() : "Untitled Checklist";

        // Remove "Checklist: " if present and add " questions"
        pageTitle = pageTitle.replace(/^Checklist:\s*/i, "").trim() + " questions";

        // Select the specific table with class "0"
        const table = document.querySelector('table.\\30');
        if (!table) {
            alert("Table not found.");
            return;
        }

        const rows = table.querySelectorAll("tr");
        const questions = [];

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length > 0) {
                const questionText = cells[0].innerText.trim();
                if (questionText) {
                    questions.push([questionText]);
                }
            }
        });

        // Prepend the modified title
        const allLines = [[pageTitle], ...questions];
        const tsv = allLines.map(line => line.join("\t")).join("\n");

        navigator.clipboard.writeText(tsv)
            .then(() => alert('Checklist questions copied to clipboard!'))
            .catch(err => console.error('Failed to copy data:', err));
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

    function selectNoAccess() {
        // Select the <select> element
        var selectElement = document.querySelector('.form-input.form-select');

        // Change the value
        selectElement.value = "";

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

    function copyRoleCheckboxValue(type) {
        const checkboxes = document.querySelectorAll('input[name*="[roles]"]');
        let tsv = 'Role\tValue\n'; // TSV header

        checkboxes.forEach(checkbox => {
            const id = checkbox.id;
            const label = document.querySelector(`label[for="${id}"]`);

            if (label) {
                let labelText = label.textContent.trim().replace(/"/g, '""');

                // Add apostrophe if label starts with a "+"
                if (labelText.startsWith('+')) {
                    labelText = `'${labelText}`;
                }

                const valueText = checkbox.value.replace(/"/g, '""');
                tsv += `"${labelText}"\t"${valueText}"\n`;
            }
        });

        // Copy to clipboard
        navigator.clipboard.writeText(tsv)
            .then(() => alert('Data copied to clipboard!'))
            .catch(err => console.error('Failed to copy data:', err));

        navigateToRolePage(type);
    }

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
            selectUser();
            submitAccessForm();
        });

        document.body.appendChild(button);
    }

    function addNoAccessButton() {
        if (document.getElementById('setNoAccessButton')) return;

        let button = document.createElement('button');
        button.id = 'setNoAccessButton';
        button.innerText = 'Remove access';
        button.title = 'Set this employee as access -';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '439px';
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
            selectNoAccess();
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

    function addCopyRoleTagButton() {
        if (document.getElementById('copyRoleTag')) return;

        let button = document.createElement('button');
        button.id = 'copyRoleTag';
        button.innerText = 'Copy Role Tags';
        button.title = 'Copy all Role Tags in CSV format (for Ollies scripts)';
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
            navigateToNewDocumentPage('employee');
        });

        document.body.appendChild(button);
    }

    function addCopyAssetTypeTagButton() {
        if (document.getElementById('copyAssetTypeTag')) return;

        let button = document.createElement('button');
        button.id = 'copyAssetTypeTag';
        button.innerText = 'Copy Asset Type Tags';
        button.title = 'Copy all Asset Type Tags in CSV format (for Ollies scripts)';
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
            navigateToNewDocumentPage('asset');
        });

        document.body.appendChild(button);
    }

    function addCopyRoleUUIDButton() {
        if (document.getElementById('copyRoleUUID')) return;

        let button = document.createElement('button');
        button.id = 'copyRoleUUID';
        button.innerText = 'Copy Role UUIDs';
        button.title = 'Copy all Role UUIDs in CSV format (for Ollies scripts)';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '200px';
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
            navigateToNewEmployeePage();
        });

        document.body.appendChild(button);
    }

    function addAnnualDocumentDefaultButton() {
        if (document.getElementById('annualDocumentDefault')) return;

        let button = document.createElement('button');
        button.id = 'annualDocumentDefault';
        button.innerText = 'Set annual default';
        button.title = 'Sets scope to anonymous. Sets severity to minor. Sets interval to 1 year. Sets lead time to 2 weeks.';
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
            annualDocumentDefault();
        });

        document.body.appendChild(button);
    }

    function addCopyChecklistQuestionsButton() {
        if (document.getElementById('copyChecklistQuestions')) return;

        let button = document.createElement('button');
        button.id = 'copyChecklistQuestions';
        button.innerText = 'Copy checklist questions';
        button.title = 'Copy all questions for this checklist';
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
            copyChecklistQuestions();
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
        button.style.backgroundColor = '#db2777'; // opus pink
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

    function addAuditCSVExportButton() {
        if (document.getElementById('auditCSVExport')) return;

        let button = document.createElement('button');
        button.id = 'auditCSVExport';
        button.innerText = 'Audit CSV export';
        button.title = 'Export this audit to CSV';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '210px';
        button.style.padding = '9px 13px';
        button.style.backgroundColor = '#047857';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontWeight = '500';
        button.style.fontFamily = 'RubikVariable, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji';
        button.style.fontSize = '.875rem';

        button.addEventListener('click', function() {
            auditCSVExport();
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

    function handleAuditEditPageFilter() {
        if (window.location.href.includes("templates/checklists/dGF") && window.location.href.includes("/edit?checklist=")) {
            setTimeout(() => {
                addAuditCSVExportButton(); // Trigger addButton
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
                addNoAccessButton();
            }, 1000);
        } else {
            return; // If URL doesn't match, stop the script
        }
    }

    function handleChecklistTemplatePageFilter() {
        if (window.location.href.includes("templates/checklists/dGF") && !window.location.href.includes("/edit")) {
            setTimeout(() => {
                addCopyChecklistQuestionsButton();
            }, 1000);
        } else {
            return; // If URL doesn't match, stop the script
        }
    }

    function handleNewDocumentPageFilter() {
        if (window.location.href.includes("documents/new?data")) {
            setTimeout(() => {
                addAnnualDocumentDefaultButton();
            }, 1000);
        } else {
            return; // If URL doesn't match, stop the script
        }
    }

    function handleRolePageFilter() {
        if (window.location.href.includes("roles") || window.location.href.includes("asset-types") || window.location.href.includes("documents") || window.location.href.includes("employees")) {
            const employeeRolesUrlPattern = /^https:\/\/cloud\.opus-safety\.co\.uk\/admin\/sites\/[a-f0-9-]+\/employees\/roles$/;
            const assetRolesUrlPattern = /^https:\/\/cloud\.opus-safety\.co\.uk\/admin\/sites\/[a-f0-9-]+\/equipments\/asset-types$/;

            if (employeeRolesUrlPattern.test(window.location.href)) {
                setTimeout(() => {
                    addCopyRoleTagButton(); // Trigger addButton
                    addCopyRoleUUIDButton();
                    // add more buttons if needed
                }, 1000);
            }

            if (assetRolesUrlPattern.test(window.location.href)) {
                setTimeout(() => {
                    addCopyAssetTypeTagButton();
                    // add more buttons if needed
                }, 1000);
            }

            if (window.location.href.includes('more_buttons_automation_7dca63d3')) {
                setTimeout(() => {
                    copyRoleCheckboxValue('employee');
                }, 1000);
            } // if employee role

            if (window.location.href.includes('more_buttons_automation_c6e56e7f')) {
                setTimeout(() => {
                    copyRoleCheckboxValue('asset');
                }, 1000);
            } // if asset role
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

    function handleMPPFilters() {
        if (window.location.href.includes('more_buttons_automation_53d03c6d')) {
            const textToFind = "Package Templates - (for sideloading - Do Not Edit!)";
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);

            let node;
            while (node = walker.nextNode()) {
                if (node.nodeValue.includes(textToFind)) {
                    const span = document.createElement('span');
                    span.textContent = textToFind;
                    span.style.backgroundColor = '#db2777';
                    span.style.color = 'white'; // Make text white
                    span.style.padding = '2px';
                    span.style.borderRadius = '4px';

                    const index = node.nodeValue.indexOf(textToFind);
                    const before = document.createTextNode(node.nodeValue.slice(0, index));
                    const after = document.createTextNode(node.nodeValue.slice(index + textToFind.length));

                    const parent = node.parentNode;
                    parent.replaceChild(after, node);
                    parent.insertBefore(span, after);
                    parent.insertBefore(before, span);

                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    break;
                }
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
            handleRolePageFilter();
            handleMPPFilters();
            handleChecklistTemplatePageFilter();
            handleNewDocumentPageFilter();
            handleAuditEditPageFilter();
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
