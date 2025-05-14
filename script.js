document.addEventListener('DOMContentLoaded', () => {
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

    // This table remains useful for its original purpose: showing specific target paces 
    // based on fixed percentages of the *base 150m test velocity*.
    const distanceSpecificTargets = [
        { distance: 50, percentFactor: 1.10, label: '50' }, 
        { distance: 100, percentFactor: 1.05, label: '100' },
        { distance: 150, percentFactor: 1.00, label: '150' },
        { distance: 200, percentFactor: 1.00, label: '200' } 
    ];

    // DOM Elements (sin cambios aquí)
    const paceForm = document.getElementById('paceForm');
    const swimmerNameInput = document.getElementById('swimmerName');
    const swimmerAgeInput = document.getElementById('swimmerAge');
    const time150Input = document.getElementById('time150');
    const distanceUnitInput = document.getElementById('distanceUnit');
    const strokeInput = document.getElementById('stroke');
    const errorMessageDiv = document.getElementById('errorMessage');
    const loadingIndicatorDiv = document.getElementById('loadingIndicator');
    const summaryHeaderDisplayDiv = document.getElementById('summaryHeaderDisplay');
    const displaySwimmerName = document.getElementById('displaySwimmerName');
    const displaySwimmerAge = document.getElementById('displaySwimmerAge');
    const displayTestDate = document.getElementById('displayTestDate');
    const displayTestStroke = document.getElementById('displayTestStroke');
    const displayTestDistance = document.getElementById('displayTestDistance');
    const displayTestTime = document.getElementById('displayTestTime');
    const displayBaseVelocity = document.getElementById('displayBaseVelocity');
    const specificPaceGuideContainerDiv = document.getElementById('specificPaceGuideContainer');
    const specificPaceGuideBody = document.getElementById('specificPaceGuideBody');
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

    // formatTimeForDisplay y displaySummaryHeader (sin cambios aquí)
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
        if (summaryHeaderDisplayDiv) summaryHeaderDisplayDiv.style.display = 'block';
        if (displaySwimmerName) displaySwimmerName.textContent = name || 'N/A';
        if (displaySwimmerAge) displaySwimmerAge.textContent = age || 'N/A';
        if (displayTestDate) displayTestDate.textContent = new Date().toLocaleDateString();
        if (displayTestStroke) {
            displayTestStroke.textContent = (stroke && typeof stroke === 'string') ? stroke.charAt(0).toUpperCase() + stroke.slice(1) : 'N/A';
        }
        if (displayTestDistance) {
            displayTestDistance.textContent = `150 ${unit || 'units'}`;
        }
        if (displayTestTime) {
            displayTestTime.textContent = (typeof testTime === 'number' && !isNaN(testTime)) ? `${testTime.toFixed(2)} seconds` : 'N/A';
        }
        if (displayBaseVelocity) {
            displayBaseVelocity.textContent = (typeof baseVelocity === 'number' && !isNaN(baseVelocity)) ? `${baseVelocity.toFixed(2)} ${unit || 'units'}/sec` : 'N/A';
        }
        currentCalculatedDataForPdf.summary = {
            name: name || 'N/A',
            age: age || 'N/A',
            date: new Date().toLocaleDateString(),
            stroke: (stroke && typeof stroke === 'string') ? stroke.charAt(0).toUpperCase() + stroke.slice(1) : 'N/A',
            testDistance: `150 ${unit || 'units'}`,
            testTime: (typeof testTime === 'number' && !isNaN(testTime)) ? `${testTime.toFixed(2)} seconds` : 'N/A',
            baseVelocity: (typeof baseVelocity === 'number' && !isNaN(baseVelocity)) ? `${baseVelocity.toFixed(2)} ${unit || 'units'}/sec` : 'N/A'
        };
    }

    function renderDistanceSpecificPacesTable(baseTime, unit) {
        if (!specificPaceGuideBody) return; 
        specificPaceGuideBody.innerHTML = ''; 
        currentCalculatedDataForPdf.specificPaces = [];
        const baseVelocity = 150 / baseTime;

        distanceSpecificTargets.forEach((target, index) => {
            const targetVelocityForSplit = baseVelocity * target.percentFactor;
            const targetPaceTime = target.distance / targetVelocityForSplit;
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
        if (specificPaceGuideContainerDiv) specificPaceGuideContainerDiv.style.display = 'block';
    }

    function calculateAndRenderEnergySystems(baseTime, unit) {
        if (!aerobicResultsBody || !anaerobicResultsBody) return; 
        aerobicResultsBody.innerHTML = ''; 
        anaerobicResultsBody.innerHTML = '';
        currentCalculatedDataForPdf.energySystems = [];

        const baseVelocity = 150 / baseTime; // This is the 100% test velocity from the input 150m time

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
            // Velocity for THIS specific energy system row
            const systemAdjustedVelocity = baseVelocity * system.percentFactor; 
            const percentOfTestSpeed = system.percentFactor * 100;
            const formattedPercent = `${percentOfTestSpeed.toFixed(system.percentFactor === 1.00 || system.percentFactor === 0.90 ? 1 : 0)}%`;
            
            // --- NUEVA LÓGICA PARA SPLITS DE 50 Y 100 ---
            // La velocidad para el split de 50 es la velocidad del sistema actual * 1.10
            const velocityFor50SplitSystem = systemAdjustedVelocity * 1.10;
            // La velocidad para el split de 100 es la velocidad del sistema actual * 1.05
            const velocityFor100SplitSystem = systemAdjustedVelocity * 1.05;
            // --- FIN NUEVA LÓGICA ---

            const rowData = {
                systemName: system.displayName,
                lactate: system.estimatedLactate,
                percentTestSpeed: formattedPercent,
                velocity: systemAdjustedVelocity.toFixed(2), // Velocity of this energy system
                
                // MODIFICADO: Calcular splits de 50 y 100 con la nueva lógica
                split50: formatTimeForDisplay(50 / velocityFor50SplitSystem),
                split100: formatTimeForDisplay(100 / velocityFor100SplitSystem),
                
                // Splits de 150 y 200 usan la velocidad propia del sistema (systemAdjustedVelocity)
                split150: formatTimeForDisplay(150 / systemAdjustedVelocity),
                split200: formatTimeForDisplay(200 / systemAdjustedVelocity),
                
                isTestPace: system.isTestPace || false,
                section: system.section
            };

            currentCalculatedDataForPdf.energySystems.push(rowData);

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

        if (velocityHeader) velocityHeader.textContent = `Velocity (${unit}/sec)`;
        if (resultsContainerDiv) resultsContainerDiv.style.display = 'block';
        if (downloadPdfButton) {
            downloadPdfButton.style.display = 'block';
            downloadPdfButton.disabled = false;
        }
    }
    
    // generatePDF y el resto del script (sin cambios aquí)
    function generatePDF() {
        if (!currentCalculatedDataForPdf.summary || !currentCalculatedDataForPdf.summary.name) {
            console.error("No data available to generate PDF.");
            alert("Please calculate paces first to generate a PDF.");
            return;
        }
        try {
            const { jsPDF } = window.jspdf; 
            if (!jsPDF) {
                alert("jsPDF library not loaded. PDF generation failed.");
                console.error("jsPDF library not loaded.");
                return;
            }
            const doc = new jsPDF();
            const summary = currentCalculatedDataForPdf.summary;
            const unit = distanceUnitInput.value;
            doc.setFontSize(18);
            doc.text("Swimming Pace Report", 105, 15, null, null, "center");
            doc.setFontSize(11);
            let summaryY = 25; 
            const summaryLineHeight = 7;
            const leftMargin = 14;
            doc.text(`Name: ${summary.name}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Age/Group: ${summary.age}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Date: ${summary.date}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Stroke: ${summary.stroke}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Test Distance: ${summary.testDistance}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Test Time: ${summary.testTime}`, leftMargin, summaryY); summaryY += summaryLineHeight;
            doc.text(`Base Velocity: ${summary.baseVelocity}`, leftMargin, summaryY);
            summaryY += 10; 
            if (currentCalculatedDataForPdf.specificPaces.length > 0) {
                if (summaryY > 260) { doc.addPage(); summaryY = 20; }
                doc.setFontSize(14);
                doc.text("Distance-Specific Target Paces", 105, summaryY, null, null, "center");
                summaryY += 7;
                doc.autoTable({
                    startY: summaryY,
                    head: [['Target For', 'Target % of Test Speed', 'Calculated Pace Time']],
                    body: currentCalculatedDataForPdf.specificPaces,
                    theme: 'grid',
                    headStyles: { fillColor: [108, 117, 125] },
                    styles: { fontSize: 9 },
                    margin: { top: 10, left: leftMargin, right: leftMargin },
                    didDrawPage: function (data) { summaryY = data.cursor.y; }
                });
                summaryY = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 10 : summaryY + 10;
            }
            if (summaryY > 240) { doc.addPage(); summaryY = 20; }
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
            if (summaryY > 260 && energySystemsBodyAerobic.length > 0) { doc.addPage(); summaryY = 20; }
            doc.setFontSize(11);
            doc.text("Aerobic Zones", leftMargin, summaryY); 
            summaryY += 5;
            doc.autoTable({
                startY: summaryY,
                head: head,
                body: energySystemsBodyAerobic,
                theme: 'grid',
                headStyles: { fillColor: [108, 117, 125] },
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: { 0: { cellWidth: 35 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 }},
                margin: { left: leftMargin, right: leftMargin },
                didParseCell: function (data) {
                    const systemRow = currentCalculatedDataForPdf.energySystems.filter(s => s.section === 'Aerobic')[data.row.index];
                    if (systemRow && systemRow.isTestPace) { data.cell.styles.fillColor = '#fff3cd'; data.cell.styles.fontStyle = 'bold'; }
                },
                didDrawPage: function (data) { summaryY = data.cursor.y; }
            });
            summaryY = doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY + 10 : summaryY + 10;
            if (summaryY > 260 && energySystemsBodyAnaerobic.length > 0) { doc.addPage(); summaryY = 20; }
            doc.setFontSize(11);
            doc.text("Anaerobic Zones", leftMargin, summaryY);
            summaryY += 5;
            doc.autoTable({
                startY: summaryY,
                head: head,
                body: energySystemsBodyAnaerobic,
                theme: 'grid',
                headStyles: { fillColor: [108, 117, 125] },
                styles: { fontSize: 8, cellPadding: 1.5 },
                columnStyles: { 0: { cellWidth: 35 }, 2: { cellWidth: 15 }, 3: { cellWidth: 15 }},
                margin: { left: leftMargin, right: leftMargin },
                didParseCell: function (data) {
                    const systemRow = currentCalculatedDataForPdf.energySystems.filter(s => s.section === 'Anaerobic')[data.row.index];
                    if (systemRow && systemRow.isTestPace) { data.cell.styles.fillColor = '#fff3cd'; data.cell.styles.fontStyle = 'bold';}
                }
            });
            const swimmerNameSanitized = (summary.name || 'swimmer').replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`swim_paces_${swimmerNameSanitized}.pdf`);
        } catch (e) {
            console.error("Error generating PDF:", e);
            alert("An error occurred while generating the PDF. Please check the console.");
        }
    }

    if (downloadPdfButton) downloadPdfButton.addEventListener('click', generatePDF);

    paceForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (errorMessageDiv) errorMessageDiv.style.display = 'none';
        if (summaryHeaderDisplayDiv) summaryHeaderDisplayDiv.style.display = 'none';
        if (specificPaceGuideContainerDiv) specificPaceGuideContainerDiv.style.display = 'none';
        if (resultsContainerDiv) resultsContainerDiv.style.display = 'none';
        if (downloadPdfButton) {
            downloadPdfButton.style.display = 'none';
            downloadPdfButton.disabled = true;
        }
        const swimmerName = swimmerNameInput.value.trim();
        const swimmerAge = swimmerAgeInput.value.trim();
        const time = parseFloat(time150Input.value);
        const unit = distanceUnitInput.value;
        const stroke = strokeInput.value;
        if (isNaN(time) || time <= 20 || time >= 300) {
            if (errorMessageDiv) {
                errorMessageDiv.textContent = 'Invalid time. Please enter a value between 20 and 300 seconds.';
                errorMessageDiv.style.display = 'block';
            }
            if (time150Input) time150Input.focus();
            return;
        }
        if (loadingIndicatorDiv) loadingIndicatorDiv.style.display = 'block';
        setTimeout(() => {
            try {
                const baseVelocity = 150 / time;
                displaySummaryHeader(swimmerName, swimmerAge, stroke, time, baseVelocity, unit);
                renderDistanceSpecificPacesTable(time, unit); 
                calculateAndRenderEnergySystems(time, unit);
            } catch (e) {
                console.error("Error during calculation/rendering:", e);
                if (errorMessageDiv) {
                    errorMessageDiv.textContent = 'An error occurred during calculation. Please check console for details.';
                    errorMessageDiv.style.display = 'block';
                }
            } finally {
                if (loadingIndicatorDiv) loadingIndicatorDiv.style.display = 'none';
            }
        }, 300);
    });
});
