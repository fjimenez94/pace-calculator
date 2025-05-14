document.addEventListener('DOMContentLoaded', () => {
    // Energy System Definitions (from previous approved version based on image)
    const energySystemDefinitions = [
        { displayName: 'REC', percentFactor: 0.75, estimatedLactate: '<1.5', section: 'Aerobic' },
        { displayName: 'AER 1', percentFactor: 0.76, estimatedLactate: '1.5', section: 'Aerobic' },
        { displayName: 'AER 1', percentFactor: 0.80, estimatedLactate: '3.0', section: 'Aerobic' },
        { displayName: 'AER 2', percentFactor: 0.81, estimatedLactate: '3.0', section: 'Aerobic' },
        { displayName: 'AER 2', percentFactor: 0.85, estimatedLactate: '4.0', section: 'Aerobic' },
        { displayName: 'AER 3', percentFactor: 0.86, estimatedLactate: '4.0', section: 'Aerobic' },
        { displayName: 'AER 3', percentFactor: 0.89, estimatedLactate: '5.0', section: 'Aerobic' },
        { displayName: 'VO2MAX', percentFactor: 0.90, estimatedLactate: '5.0', section: 'Anaerobic' },
        { displayName: 'VO2MAX', percentFactor: 0.92, estimatedLactate: '8.0', section: 'Anaerobic' },
        { displayName: 'ANA 1', percentFactor: 0.93, estimatedLactate: '8.0', section: 'Anaerobic' },
        { displayName: 'ANA 1', percentFactor: 0.95, estimatedLactate: '11.0', section: 'Anaerobic' },
        { displayName: 'ANA 2', percentFactor: 0.96, estimatedLactate: '11.0', section: 'Anaerobic' },
        { displayName: 'ANA 2', percentFactor: 1.00, estimatedLactate: 'MAX', section: 'Anaerobic', isTestPace: true },
    ];

    const distanceSpecificTargets = [
        { distance: 50, percentFactor: 1.10, label: '50' },
        { distance: 100, percentFactor: 1.05, label: '100' },
        { distance: 150, percentFactor: 1.00, label: '150' },
        { distance: 200, percentFactor: 1.00, label: '200' }
    ];

    // DOM Elements
    const paceForm = document.getElementById('paceForm');
    const swimmerNameInput = document.getElementById('swimmerName');
    const swimmerAgeInput = document.getElementById('swimmerAge');
    const time150Input = document.getElementById('time150');
    const distanceUnitInput = document.getElementById('distanceUnit');
    const strokeInput = document.getElementById('stroke');

    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingIndicatorDiv = document.getElementById('loadingIndicator');

    // Summary Header Display Elements
    const summaryHeaderDisplayDiv = document.getElementById('summaryHeaderDisplay');
    const displaySwimmerName = document.getElementById('displaySwimmerName');
    const displaySwimmerAge = document.getElementById('displaySwimmerAge');
    const displayTestDate = document.getElementById('displayTestDate');
    const displayTestStroke = document.getElementById('displayTestStroke');
    const displayTestDistance = document.getElementById('displayTestDistance');
    const displayTestTime = document.getElementById('displayTestTime');
    const displayBaseVelocity = document.getElementById('displayBaseVelocity');

    // Specific Pace Guide Table Elements
    const specificPaceGuideContainerDiv = document.getElementById('specificPaceGuideContainer');
    const specificPaceGuideBody = document.getElementById('specificPaceGuideBody');

    // Main Results Table Elements
    const resultsContainerDiv = document.querySelector('.results-container');
    const aerobicResultsBody = document.getElementById('aerobicResultsBody');
    const anaerobicResultsBody = document.getElementById('anaerobicResultsBody');
    const velocityHeader = document.getElementById('velocityHeader');
    const downloadPdfButton = document.getElementById('downloadPdfButton');
    
    let currentCalculatedDataForPdf = {
        summary: {},
        specificPaces: [],
        energySystems: []
    };


    function formatTimeForDisplay(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds === Infinity || totalSeconds < 0) return "N/A";
        const minutes = Math.floor(totalSeconds / 60);
        const remainingSeconds = totalSeconds % 60;
        const seconds = Math.floor(remainingSeconds);
        const centiseconds = Math.round((remainingSeconds - seconds) * 100);
        let formattedTime = `${seconds.toString().padStart(2, '0')}''${centiseconds.toString().padStart(2, '0')}`;
        if (minutes > 0) {
            formattedTime = `${minutes}' ${formattedTime}`;
        }
        return formattedTime;
    }

    function displaySummaryHeader(name, age, stroke, testTime, baseVelocity, unit) {
        summaryHeaderDisplayDiv.style.display = 'block';
        displaySwimmerName.textContent = name || 'N/A';
        displaySwimmerAge.textContent = age || 'N/A';
        displayTestDate.textContent = new Date().toLocaleDateString();
        displayTestStroke.textContent = stroke.charAt(0).toUpperCase() + stroke.slice(1);
        displayTestDistance.textContent = `150 ${unit}`;
        displayTestTime.textContent = `${testTime.toFixed(2)} seconds`;
        displayBaseVelocity.textContent = `${baseVelocity.toFixed(2)} ${unit}/sec`;

        currentCalculatedDataForPdf.summary = {
            name: name || 'N/A',
            age: age || 'N/A',
            date: new Date().toLocaleDateString(),
            stroke: stroke.charAt(0).toUpperCase() + stroke.slice(1),
            testDistance: `150 ${unit}`,
            testTime: `${testTime.toFixed(2)} seconds`,
            baseVelocity: `${baseVelocity.toFixed(2)} ${unit}/sec`
        };
    }

    function renderDistanceSpecificPacesTable(baseTime, unit) {
        specificPaceGuideBody.innerHTML = ''; // Clear previous results
        currentCalculatedDataForPdf.specificPaces = [];
        const baseVelocity = 150 / baseTime;

        distanceSpecificTargets.forEach((target, index) => {
            const targetVelocity = baseVelocity * target.percentFactor;
            const targetPaceTime = target.distance / targetVelocity;
            const formattedTime = formatTimeForDisplay(targetPaceTime);
            const percentString = `${(target.percentFactor * 100).toFixed(1)}%`;

            const row = specificPaceGuideBody.insertRow();
            row.style.animationDelay = `${index * 0.07}s`;
            row.insertCell().textContent = `${target.label} ${unit}`;
            row.insertCell().textContent = percentString;
            row.insertCell().textContent = formattedTime;
            
            currentCalculatedDataForPdf.specificPaces.push([
                `${target.label} ${unit}`,
                percentString,
                formattedTime
            ]);
        });
        specificPaceGuideContainerDiv.style.display = 'block';
    }


    function calculateAndRenderEnergySystems(baseTime, unit) {
        aerobicResultsBody.innerHTML = ''; 
        anaerobicResultsBody.innerHTML = '';
        currentCalculatedDataForPdf.energySystems = [];

        const baseVelocity = 150 / baseTime;

        const aerobicHeaderRow = aerobicResultsBody.insertRow();
        aerobicHeaderRow.classList.add('section-header');
        const aerobicHeaderCell = aerobicHeaderRow.insertCell();
        aerobicHeaderCell.colSpan = 8;
        aerobicHeaderCell.innerHTML = `Aerobic Zones (Est. Lactate <1.5-5.0 mmol/L, ~75-89% Test Speed)`;
        
        const anaerobicHeaderRow = anaerobicResultsBody.insertRow();
        anaerobicHeaderRow.classList.add('section-header');
        const anaerobicHeaderCell = anaerobicHeaderRow.insertCell();
        anaerobicHeaderCell.colSpan = 8;
        anaerobicHeaderCell.innerHTML = `Anaerobic Zones (Est. Lactate 5.0-MAX mmol/L, ~90-100% Test Speed)`;

        let rowIndex = 0;
        energySystemDefinitions.forEach(system => {
            const adjustedVelocity = baseVelocity * system.percentFactor;
            const percentOfTestSpeed = system.percentFactor * 100;
            const formattedPercent = `${percentOfTestSpeed.toFixed(system.percentFactor === 1.00 || system.percentFactor === 0.90 ? 1 : 0)}%`;
            
            const rowData = {
                systemName: system.displayName,
                lactate: system.estimatedLactate,
                percentTestSpeed: formattedPercent,
                velocity: adjustedVelocity.toFixed(2),
                split50: formatTimeForDisplay(50 / adjustedVelocity),
                split100: formatTimeForDisplay(100 / adjustedVelocity),
                split150: formatTimeForDisplay(150 / adjustedVelocity),
                split200: formatTimeForDisplay(200 / adjustedVelocity),
                isTestPace: system.isTestPace || false,
                section: system.section
            };

            currentCalculatedDataForPdf.energySystems.push(rowData); // Store full object for PDF generation flexibility

            const targetBody = rowData.section === 'Aerobic' ? aerobicResultsBody : anaerobicResultsBody;
            const row = targetBody.insertRow();
            row.style.animationDelay = `${rowIndex * 0.07}s`;
            rowIndex++;

            if (rowData.isTestPace) row.classList.add('highlight-test-pace');

            row.insertCell().textContent = rowData.systemName;
            row.insertCell().textContent = rowData.lactate;
            row.insertCell().textContent = rowData.percentTestSpeed;
            row.insertCell().textContent = rowData.velocity;
            row.insertCell().textContent = rowData.split50;
            row.insertCell().textContent = rowData.split100;
            row.insertCell().textContent = rowData.split150;
            row.insertCell().textContent = rowData.split200;
        });

        velocityHeader.textContent = `Velocity (${unit}/sec)`;
        resultsContainerDiv.style.display = 'block';
        downloadPdfButton.style.display = 'block';
        downloadPdfButton.disabled = false;
    }
    
    function generatePDF() {
        if (!currentCalculatedDataForPdf.summary.name) { // Check if data is available
            console.error("No data available to generate PDF.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const summary = currentCalculatedDataForPdf.summary;
        const unit = distanceUnitInput.value; // Get current unit for headers

        // Title
        doc.setFontSize(18);
        doc.text("Swimming Pace Report", 105, 15, null, null, "center");

        // Summary Information
        doc.setFontSize(11);
        let summaryY = 25;
        doc.text(`Name: ${summary.name}`, 14, summaryY);
        doc.text(`Age/Group: ${summary.age}`, 14, summaryY += 7);
        doc.text(`Date: ${summary.date}`, 14, summaryY += 7);
        doc.text(`Stroke: ${summary.stroke}`, 14, summaryY += 7);
        doc.text(`Test Distance: ${summary.testDistance}`, 14, summaryY += 7);
        doc.text(`Test Time: ${summary.testTime}`, 14, summaryY += 7);
        doc.text(`Base Velocity: ${summary.baseVelocity}`, 14, summaryY += 7);
        
        summaryY += 10; // Space before next table

        // Distance-Specific Target Paces Table
        if (currentCalculatedDataForPdf.specificPaces.length > 0) {
            doc.setFontSize(14);
            doc.text("Distance-Specific Target Paces", 105, summaryY, null, null, "center");
            summaryY += 7;
            doc.autoTable({
                startY: summaryY,
                head: [['Target For', 'Target % of Test Speed', 'Calculated Pace Time']],
                body: currentCalculatedDataForPdf.specificPaces,
                theme: 'grid',
                headStyles: { fillColor: [108, 117, 125] }, // secondary-color
                styles: { fontSize: 9 },
                margin: { top: 10, left: 14, right: 14 },
                didDrawPage: function (data) { // Update Y for next table if page break
                    summaryY = data.cursor.y;
                }
            });
            summaryY += 10; // Space after this table
        }


        // Main Energy Systems Table
        doc.setFontSize(14);
        doc.text("Energy System Paces", 105, summaryY, null, null, "center");
        summaryY += 7;

        const energySystemsBodyAerobic = currentCalculatedDataForPdf.energySystems
            .filter(sys => sys.section === 'Aerobic')
            .map(sys => [sys.systemName, sys.lactate, sys.percentTestSpeed, sys.velocity, sys.split50, sys.split100, sys.split150, sys.split200]);

        const energySystemsBodyAnaerobic = currentCalculatedDataForPdf.energySystems
            .filter(sys => sys.section === 'Anaerobic')
            .map(sys => [sys.systemName, sys.lactate, sys.percentTestSpeed, sys.velocity, sys.split50, sys.split100, sys.split150, sys.split200]);
        
        const head = [['Energy System', 'Lactate', '% Test', `Vel (${unit}/s)`, '50', '100', '150', '200']];

        // Aerobic Table
        doc.setFontSize(11);
        doc.text("Aerobic Zones (Est. Lactate <1.5-5.0 mmol/L, ~75-89% Test Speed)", 14, summaryY);
        summaryY += 5;
        doc.autoTable({
            startY: summaryY,
            head: head,
            body: energySystemsBodyAerobic,
            theme: 'grid',
            headStyles: { fillColor: [108, 117, 125] }, // secondary-color
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: {
                0: { cellWidth: 35 }, // Energy System name
                2: { cellWidth: 15 }, // % Test
                3: { cellWidth: 15 }, // Vel
            },
            margin: { top: 10, left: 14, right: 14 },
            didParseCell: function (data) {
                const system = currentCalculatedDataForPdf.energySystems.find(s => 
                    s.section === 'Aerobic' && 
                    s.systemName === data.row.raw[0] && 
                    s.percentTestSpeed === data.row.raw[2]
                );
                if (system && system.isTestPace) {
                    data.cell.styles.fillColor = '#fff3cd'; // highlight-color
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawPage: function (data) {
                summaryY = data.cursor.y;
            }
        });
        summaryY += 10; // Space after Aerobic table

        // Anaerobic Table
        doc.setFontSize(11);
        doc.text("Anaerobic Zones (Est. Lactate 5.0-MAX mmol/L, ~90-100% Test Speed)", 14, summaryY);
        summaryY += 5;
        doc.autoTable({
            startY: summaryY,
            head: head,
            body: energySystemsBodyAnaerobic,
            theme: 'grid',
            headStyles: { fillColor: [108, 117, 125] },
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: {
                0: { cellWidth: 35 },
                2: { cellWidth: 15 },
                3: { cellWidth: 15 },
            },
            margin: { top: 10, left: 14, right: 14 },
             didParseCell: function (data) {
                const system = currentCalculatedDataForPdf.energySystems.find(s => 
                    s.section === 'Anaerobic' && 
                    s.systemName === data.row.raw[0] && 
                    s.percentTestSpeed === data.row.raw[2]
                );
                 if (system && system.isTestPace) {
                    data.cell.styles.fillColor = '#fff3cd'; // highlight-color
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        const swimmerNameSanitized = (summary.name || 'swimmer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`swim_paces_${swimmerNameSanitized}.pdf`);
    }


    downloadPdfButton.addEventListener('click', generatePDF);

    paceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        // Clear previous display states
        errorMessageDiv.style.display = 'none';
        summaryHeaderDisplayDiv.style.display = 'none';
        specificPaceGuideContainerDiv.style.display = 'none';
        resultsContainerDiv.style.display = 'none';
        downloadPdfButton.style.display = 'none';
        downloadPdfButton.disabled = true;

        const swimmerName = swimmerNameInput.value.trim();
        const swimmerAge = swimmerAgeInput.value.trim();
        const time = parseFloat(time150Input.value);
        const unit = distanceUnitInput.value;
        const stroke = strokeInput.value;

        if (isNaN(time) || time <= 20 || time >= 300) {
            errorMessageDiv.textContent = 'Invalid time. Please enter a value between 20 and 300 seconds.';
            errorMessageDiv.style.display = 'block';
            time150Input.focus();
            return;
        }

        loadingIndicatorDiv.style.display = 'block';

        setTimeout(() => {
            const baseVelocity = 150 / time;
            displaySummaryHeader(swimmerName, swimmerAge, stroke, time, baseVelocity, unit);
            renderDistanceSpecificPacesTable(time, unit);
            calculateAndRenderEnergySystems(time, unit);
            
            loadingIndicatorDiv.style.display = 'none';
        }, 300);
    });
});