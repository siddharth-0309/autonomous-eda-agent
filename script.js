const API_URL = "https://runner-health-gbp-church.trycloudflare.com";

const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const uploadStatus = document.getElementById("uploadStatus");

analyzeBtn.addEventListener("click", analyzeDataset);

async function analyzeDataset() {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV or Excel file!");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    analyzeBtn.disabled = true;
    analyzeBtn.innerText = "Analyzing...";
    uploadStatus.innerHTML = "⏳ Running EDA Engine...";

    try {

        const response = await fetch(`${API_URL}/analyze`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        // KPI
        document.getElementById("rows").innerText = data.profile.rows;
        document.getElementById("columns").innerText = data.profile.columns;
        document.getElementById("missing").innerText = data.profile.missing;
        document.getElementById("duplicates").innerText = data.profile.duplicates;

        // Column List
        let html = `
            <div class="glass-card">
                <h3>Dataset Overview</h3>
                <p><b>Total Columns:</b> ${data.profile.columns}</p>

                <div class="chip-container">
        `;

        data.column_names.forEach(col => {
            html += `<span class="chip">${col}</span>`;
        });

        html += `</div></div>`;

        document.getElementById("dashboard").innerHTML = html;

        uploadStatus.innerHTML = "✅ Analysis Completed";

    } catch (err) {

        console.error(err);

        uploadStatus.innerHTML = "❌ Connection Failed";

    }

    analyzeBtn.disabled = false;
    analyzeBtn.innerText = "Analyze Dataset";

}
