document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "https://equity-grants-copying-brisbane.trycloudflare.com";

    const fileInput = document.getElementById("fileInput");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const uploadStatus = document.getElementById("uploadStatus");

    console.log("🚀 Script loaded");
    console.log("File input:", fileInput);
    console.log("Analyze button:", analyzeBtn);

    if (!fileInput || !analyzeBtn) {
        console.error("❌ fileInput or analyzeBtn not found!");
        return;
    }

    analyzeBtn.addEventListener("click", analyzeDataset);

    async function analyzeDataset() {

        console.log("🔥 Analyze button clicked");

        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a CSV or Excel file!");
            return;
        }

        console.log("📁 File:", file.name);

        const formData = new FormData();
        formData.append("file", file);

        analyzeBtn.disabled = true;
        analyzeBtn.innerText = "Analyzing...";

        if (uploadStatus) {
            uploadStatus.innerHTML = "⏳ Running EDA Engine...";
        }

        try {

            console.log("🌐 Sending request...");
            console.log("API:", API_URL);

            const response = await fetch(`${API_URL}/analyze`, {
                method: "POST",
                body: formData
            });

            console.log("📡 Response status:", response.status);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            console.log("✅ API Response:", data);

            // KPI
            document.getElementById("rows").innerText =
                data.profile.rows;

            document.getElementById("columns").innerText =
                data.profile.columns;

            document.getElementById("missing").innerText =
                data.profile.missing;

            document.getElementById("duplicates").innerText =
                data.profile.duplicates;

            // Dataset Overview
            let html = `
                <div class="glass-card">
                    <h3>Dataset Overview</h3>

                    <p>
                        <b>Total Columns:</b>
                        ${data.profile.columns}
                    </p>

                    <div class="chip-container">
            `;

            data.column_names.forEach(col => {
                html += `
                    <span class="chip">${col}</span>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            document.getElementById("dashboard").innerHTML = html;

            if (uploadStatus) {
                uploadStatus.innerHTML =
                    "✅ Analysis Completed";
            }

        } catch (error) {

            console.error("❌ ERROR:", error);

            if (uploadStatus) {
                uploadStatus.innerHTML =
                    "❌ Connection Failed";
            }

            alert(
                "Connection failed.\n\n" +
                "Open F12 → Console and check the error."
            );

        } finally {

            analyzeBtn.disabled = false;
            analyzeBtn.innerText = "Analyze Dataset";

        }
    }

});
