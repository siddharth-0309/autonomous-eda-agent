const fileInput = document.getElementById("fileInput");
const analyzeBtn = document.getElementById("analyzeBtn");

analyzeBtn.addEventListener("click", () => {

    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a CSV or Excel file!");
        return;
    }

    // Dummy UI update
    document.getElementById("rows").innerText = "--";
    document.getElementById("columns").innerText = "--";
    document.getElementById("missing").innerText = "--";
    document.getElementById("duplicates").innerText = "--";

    document.getElementById("dashboard").innerHTML = `
        <div class="glass-card">
            <h3>📁 Dataset Selected</h3>
            <p><strong>File:</strong> ${file.name}</p>
            <p>Backend not connected yet.</p>
            <p>Next step: FastAPI integration.</p>
        </div>
    `;
});
