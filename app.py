
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import io


# =========================================================
# PAGE CONFIG
# =========================================================

st.set_page_config(
    page_title="Autonomous EDA Agent",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)


# =========================================================
# CUSTOM CSS
# =========================================================

st.markdown("""
<style>

.stApp {
    background: #080d18;
}

.block-container {
    max-width: 1400px;
    padding-top: 2rem;
    padding-bottom: 4rem;
}

.hero {
    padding: 35px;
    border-radius: 24px;
    background: linear-gradient(
        135deg,
        #111827,
        #172554
    );
    border: 1px solid #26324a;
    margin-bottom: 25px;
}

.hero-title {
    font-size: 45px;
    font-weight: 800;
    margin-bottom: 8px;
}

.hero-subtitle {
    color: #9ca3af;
    font-size: 17px;
}

.metric-card {
    padding: 22px;
    border-radius: 18px;
    background: #111827;
    border: 1px solid #26324a;
    min-height: 120px;
}

.metric-label {
    color: #9ca3af;
    font-size: 14px;
}

.metric-value {
    font-size: 32px;
    font-weight: 800;
    margin-top: 8px;
}

.section-card {
    padding: 24px;
    border-radius: 18px;
    background: #111827;
    border: 1px solid #26324a;
    margin-top: 20px;
}

.footer {
    text-align: center;
    color: #6b7280;
    padding: 30px;
    margin-top: 40px;
}

</style>
""", unsafe_allow_html=True)


# =========================================================
# HEADER
# =========================================================

st.markdown("""
<div class="hero">

<div class="hero-title">
📊 Autonomous EDA Agent
</div>

<div class="hero-subtitle">
Upload your dataset and automatically explore,
profile and analyze your data.
</div>

</div>
""", unsafe_allow_html=True)


# =========================================================
# SIDEBAR
# =========================================================

with st.sidebar:

    st.markdown("## ⚙️ EDA Agent")

    st.write(
        "Upload a CSV or Excel dataset to start analysis."
    )

    uploaded_file = st.file_uploader(
        "📁 Upload Dataset",
        type=["csv", "xlsx", "xls"]
    )

    st.divider()

    st.markdown("### Supported Files")

    st.write("📄 CSV")
    st.write("📊 XLSX")
    st.write("📊 XLS")

    st.divider()

    st.caption("Autonomous EDA Agent")


# =========================================================
# NO FILE STATE
# =========================================================

if uploaded_file is None:

    st.markdown("""
    <div class="section-card">

    ## 🚀 Ready to Analyze

    Upload your dataset from the sidebar.

    ### The agent will provide

    🔹 Dataset overview  
    🔹 Column profiling  
    🔹 Missing value analysis  
    🔹 Duplicate detection  
    🔹 Numerical statistics  
    🔹 Categorical analysis  
    🔹 Data visualizations  
    🔹 Automatic insights  

    </div>
    """, unsafe_allow_html=True)

    st.stop()


# =========================================================
# LOAD DATASET
# =========================================================

try:

    file_name = uploaded_file.name.lower()

    if file_name.endswith(".csv"):

        df = pd.read_csv(uploaded_file)

    elif file_name.endswith(".xlsx") or file_name.endswith(".xls"):

        df = pd.read_excel(uploaded_file)

    else:

        st.error("Unsupported file format.")
        st.stop()

except Exception as e:

    st.error(f"❌ Error reading dataset: {e}")
    st.stop()


# =========================================================
# BASIC PROFILE
# =========================================================

rows = len(df)

columns = len(df.columns)

missing = int(
    df.isna().sum().sum()
)

duplicates = int(
    df.duplicated().sum()
)

total_cells = rows * columns

memory_mb = (
    df.memory_usage(deep=True).sum()
    / 1024 / 1024
)


# =========================================================
# SUCCESS MESSAGE
# =========================================================

st.success(
    f"✅ Dataset loaded successfully: **{uploaded_file.name}**"
)


# =========================================================
# KPI CARDS
# =========================================================

c1, c2, c3, c4, c5 = st.columns(5)


with c1:

    st.markdown(
        f"""
        <div class="metric-card">
        <div class="metric-label">ROWS</div>
        <div class="metric-value">{rows:,}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


with c2:

    st.markdown(
        f"""
        <div class="metric-card">
        <div class="metric-label">COLUMNS</div>
        <div class="metric-value">{columns:,}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


with c3:

    st.markdown(
        f"""
        <div class="metric-card">
        <div class="metric-label">MISSING</div>
        <div class="metric-value">{missing:,}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


with c4:

    st.markdown(
        f"""
        <div class="metric-card">
        <div class="metric-label">DUPLICATES</div>
        <div class="metric-value">{duplicates:,}</div>
        </div>
        """,
        unsafe_allow_html=True
    )


with c5:

    st.markdown(
        f"""
        <div class="metric-card">
        <div class="metric-label">MEMORY</div>
        <div class="metric-value">{memory_mb:.1f} MB</div>
        </div>
        """,
        unsafe_allow_html=True
    )


# =========================================================
# TABS
# =========================================================

tab_overview, tab_columns, tab_stats, tab_quality, tab_charts, tab_preview = st.tabs(
    [
        "📋 Overview",
        "🔍 Columns",
        "📈 Statistics",
        "⚠️ Data Quality",
        "📊 Visualizations",
        "👀 Preview"
    ]
)


# =========================================================
# OVERVIEW
# =========================================================

with tab_overview:

    st.subheader("Dataset Overview")

    left, right = st.columns(2)

    with left:

        st.markdown(
            '<div class="section-card">',
            unsafe_allow_html=True
        )

        st.markdown("### 📦 Dataset Information")

        st.write(f"**File:** {uploaded_file.name}")

        st.write(f"**Rows:** {rows:,}")

        st.write(f"**Columns:** {columns:,}")

        st.write(f"**Total Cells:** {total_cells:,}")

        st.write(
            f"**Memory Usage:** {memory_mb:.2f} MB"
        )

        st.markdown("</div>", unsafe_allow_html=True)


    with right:

        st.markdown(
            '<div class="section-card">',
            unsafe_allow_html=True
        )

        st.markdown("### 🧬 Data Types")

        dtype_df = (
            df.dtypes
            .astype(str)
            .value_counts()
            .reset_index()
        )

        dtype_df.columns = [
            "Data Type",
            "Count"
        ]

        st.dataframe(
            dtype_df,
            use_container_width=True,
            hide_index=True
        )

        st.markdown("</div>", unsafe_allow_html=True)


# =========================================================
# COLUMN PROFILE
# =========================================================

with tab_columns:

    st.subheader("🔍 Column Profile")

    column_info = []

    for col in df.columns:

        column_info.append({

            "Column": col,

            "Data Type": str(
                df[col].dtype
            ),

            "Non-Null": int(
                df[col].notna().sum()
            ),

            "Missing": int(
                df[col].isna().sum()
            ),

            "Missing %": round(
                df[col].isna().mean() * 100,
                2
            ),

            "Unique": int(
                df[col].nunique()
            )

        })

    column_df = pd.DataFrame(
        column_info
    )

    st.dataframe(
        column_df,
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# STATISTICS
# =========================================================

with tab_stats:

    st.subheader("📈 Statistical Analysis")

    numerical_df = df.select_dtypes(
        include=np.number
    )

    if not numerical_df.empty:

        st.markdown(
            "### 🔢 Numerical Statistics"
        )

        stats_df = (
            numerical_df
            .describe()
            .T
            .round(3)
        )

        st.dataframe(
            stats_df,
            use_container_width=True
        )

    else:

        st.info(
            "No numerical columns found."
        )


    st.markdown("---")

    categorical_df = df.select_dtypes(
        exclude=np.number
    )

    if not categorical_df.empty:

        st.markdown(
            "### 🏷️ Categorical Analysis"
        )

        selected_cat = st.selectbox(
            "Select a categorical column",
            categorical_df.columns
        )

        counts = (
            df[selected_cat]
            .value_counts()
            .head(20)
        )

        st.bar_chart(counts)

        st.dataframe(
            counts.reset_index(),
            use_container_width=True,
            hide_index=True
        )

    else:

        st.info(
            "No categorical columns found."
        )


# =========================================================
# DATA QUALITY
# =========================================================

with tab_quality:

    st.subheader("⚠️ Data Quality Report")

    quality_data = []

    for col in df.columns:

        missing_count = int(
            df[col].isna().sum()
        )

        missing_percentage = (
            missing_count / rows * 100
            if rows > 0
            else 0
        )

        quality_data.append({

            "Column": col,

            "Missing": missing_count,

            "Missing %": round(
                missing_percentage,
                2
            ),

            "Unique": int(
                df[col].nunique()
            ),

            "Duplicates": int(
                df[col].duplicated().sum()
            )

        })

    quality_df = pd.DataFrame(
        quality_data
    )

    st.dataframe(
        quality_df,
        use_container_width=True,
        hide_index=True
    )


    st.markdown("### 🧠 Automatic Findings")

    if missing > 0:

        st.warning(
            f"⚠️ Dataset contains **{missing:,} missing values**."
        )

    else:

        st.success(
            "✅ No missing values detected."
        )


    if duplicates > 0:

        st.warning(
            f"⚠️ Dataset contains **{duplicates:,} duplicate rows**."
        )

    else:

        st.success(
            "✅ No duplicate rows detected."
        )


    constant_columns = [
        col
        for col in df.columns
        if df[col].nunique(dropna=False) <= 1
    ]

    if constant_columns:

        st.warning(
            "⚠️ Constant columns detected: "
            + ", ".join(
                map(str, constant_columns)
            )
        )

    else:

        st.success(
            "✅ No constant columns detected."
        )


# =========================================================
# VISUALIZATIONS
# =========================================================

with tab_charts:

    st.subheader("📊 Data Visualizations")

    numeric_columns = list(
        df.select_dtypes(
            include=np.number
        ).columns
    )

    if not numeric_columns:

        st.info(
            "No numerical columns available."
        )

    else:

        selected_column = st.selectbox(
            "Select numerical column",
            numeric_columns
        )

        chart_type = st.radio(
            "Chart Type",
            [
                "Histogram",
                "Box Plot"
            ],
            horizontal=True
        )

        fig, ax = plt.subplots()

        if chart_type == "Histogram":

            ax.hist(
                df[selected_column].dropna(),
                bins=30
            )

            ax.set_title(
                f"Distribution of {selected_column}"
            )

            ax.set_xlabel(
                selected_column
            )

            ax.set_ylabel(
                "Frequency"
            )

        else:

            ax.boxplot(
                df[selected_column].dropna()
            )

            ax.set_title(
                f"Box Plot - {selected_column}"
            )

            ax.set_ylabel(
                selected_column
            )

        st.pyplot(
            fig,
            use_container_width=True
        )

        plt.close(fig)


# =========================================================
# PREVIEW
# =========================================================

with tab_preview:

    st.subheader("👀 Dataset Preview")

    max_rows = min(
        100,
        max(5, rows)
    )

    preview_rows = st.slider(
        "Number of rows",
        min_value=5,
        max_value=max_rows,
        value=min(10, max_rows)
    )

    st.dataframe(
        df.head(preview_rows),
        use_container_width=True,
        hide_index=True
    )


# =========================================================
# DOWNLOAD
# =========================================================

st.divider()

st.subheader("⬇️ Export")

csv_buffer = io.StringIO()

df.to_csv(
    csv_buffer,
    index=False
)

st.download_button(
    label="⬇️ Download Dataset as CSV",
    data=csv_buffer.getvalue(),
    file_name="eda_dataset.csv",
    mime="text/csv"
)


# =========================================================
# FOOTER
# =========================================================

st.markdown("""
<div class="footer">

Autonomous EDA Agent • Built with Python, Pandas & Streamlit

</div>
""", unsafe_allow_html=True)
