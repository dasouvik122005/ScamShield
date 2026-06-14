<p align="center">
  <img src="static/logo_full.png" alt="ScamShield Logo" width="380">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/python-3.12-blue?style=flat-square" alt="Python 3.12">
  <img src="https://img.shields.io/badge/platform-Flask-orange?style=flat-square" alt="Flask">
  <a href="SECURITY.md"><img src="https://img.shields.io/badge/security-policy-success?style=flat-square" alt="Security Policy"></a>
  <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/code%20of-conduct-blueviolet?style=flat-square" alt="Code of Conduct"></a>
</p>

<p align="center">
  <a href="LICENSE"><strong>MIT License</strong></a> •
  <a href="CODE_OF_CONDUCT.md"><strong>Code of Conduct</strong></a> •
  <a href="CONTRIBUTING.md"><strong>Contributing Guidelines</strong></a> •
  <a href="SECURITY.md"><strong>Security Policy</strong></a>
</p>

# ScamShield: Fake Job Posting Detection Platform (2026 Upgrades)

ScamShield is a real-time AI/ML platform that audits job descriptions, checks URLs, verifies company registrations, and analyzes recruiter contact channels to calculate a comprehensive **Trust Score (0-100%)** before applicants submit their data.

---

## 🛠️ System Architecture

ScamShield evaluates job postings using a **7-Stage Horizontal Verification Pipeline**:
```
[Ingested] ➔ [NLP Text] ➔ [URL Scan] ➔ [Company Check] ➔ [Recruiter Check] ➔ [Trust Score] ➔ [Decision]
```

The system verifies credibility across **5 Trust Pillars**:

1. **NLP Text Analysis (Brain)**:
   - Evaluates semantics using a machine learning text classifier.
   - Audits vocabulary density and clickbait signals (e.g. excessive exclamation marks).
   - Analyzes lexical complexity via the **Flesch Reading Ease** index to detect convoluted machine-generated templates.
2. **URL Phishing Scan (Link)**:
   - Inspects embedded links for secure SSL protocols (`https://` protocols vs insecure `http://`).
   - Audits domains against suspicious free hosting providers (e.g., Blogspot, WordPress, Wix) and url shorteners (e.g., bit.ly).
3. **Company Check (Magnifying Glass)**:
   - Validates description completeness (checks if company profiles are missing or too short).
   - Audits company names against official corporate registry structures (identifying standard suffixes like *Ltd*, *Inc*, *LLP*, *Pvt*).
4. **Recruiter Behavior Check (Shield)**:
   - Scans for personal contact details (embedded personal emails and phone numbers in the description text).
   - Audits email domains, distinguishing between public free email providers (e.g. `@gmail.com`, `@yahoo.com`) and validated corporate domains.
   - Cross-references job locations against historical regional fraud ratios.
   - Flags pressure tactics and urgency terms (e.g., *"URGENT"*, *"IMMEDIATE"*).
5. **Trust Score Engine (Metric/Dial)**:
   - Integrates machine learning probabilities and heuristic risk metrics to compute a credibility rating (**0 to 100%**).
   - **80% - 100%**: High Trust (Verified Safe / Approved)
   - **50% - 79%**: Neutral Risk (Verification Advised)
   - **Below 50%**: Low Trust (Scam Vulnerability Alert / Application Blocked)

---

## 📈 Machine Learning & Model Performance

The core prediction models have been upgraded to maximize prediction accuracy and minimize false-positive warning triggers:

* **Text Classifier**: Upgraded from `CountVectorizer` to `TfidfVectorizer` (with 10,000 max features) and trained an `SGDClassifier(loss='log_loss')` on balanced training sets using `SMOTE`. This filters vocabulary noise, raising the individual text F1-score from **76.52%** to **80.97%**.
* **Tabular Classifier**: Replaced the linear model with a tree-based `RandomForestClassifier` (100 estimators) which naturally models non-linear correlations (like location threat ratios, character lengths, and Flesch scores) without scaling bias. This boosted the individual tabular F1-score from **16.54%** to **56.32%**.
* **Ensemble Soft Voting**: Combined model outputs using a weighted soft-voting model (`0.5 * Text Risk + 0.5 * Tabular Risk`) combined with a heuristic check penalty. This produces:
  - **Ensemble Accuracy**: **98.11%** (was 93.74%)
  - **Ensemble F1 Score**: **84.93%** (was 62.31%)
  - **Ensemble Precision**: **89.86%** (was 51.71% — **reducing false alarm flags by 90%**)
  - **Ensemble Recall**: **80.52%** (was 78.35%)

---

## 🎨 Premium Visual Interface

The interface is built using Vanilla CSS for clean separation of concerns and features:
* **Horizontal Pipeline Tracker**: Connects processing nodes with glowing neon tracks, animating step-by-step during live scans.
* **Trust Pillars Grid**: Sleek, hover-responsive cards representing the 4 checks (NLP, URL, Company, Recruiter) with color-coded status badges (`Passed` in green, `Warning` in amber, `Failed` in red).
* **Theme Toggle Switch**: Sun/Moon switch in the header that toggles between:
  - *Obsidian Dark Theme*: A dark obsidian slate background (`#080a14`) with amethyst purple accents and glowing elements.
  - *Alabaster Light Theme*: A soft slate-cream background (`#f8fafc`) with deep indigo highlights and clean card shadows.
* **Developer telemetry fine print**: A small section at the bottom displaying raw machine learning model flags and location ratios for validation.

---

## 🚀 How to Set Up and Run

### 1. Prerequisites
Install the required packages:
```bash
pip install flask pandas numpy scikit-learn imbalanced-learn joblib textstat beautifulsoup4 nltk
```

### 2. Train the Models
Train and serialize the TF-IDF vectorizers and Random Forest classifiers on the balanced dataset:
```bash
python train_model.py
```
This script will output the accuracy metrics and save the binary files into the `models/` directory:
- `tfidf_vectorizer.pkl`
- `clf_log.pkl` (text classifier)
- `clf_num.pkl` (tabular classifier)
- `numeric_features.pkl`

### 3. Run the Web Server
Launch the Flask development server:
```bash
python app.py
```
Open your web browser and navigate to **`http://127.0.0.1:5000`** to access the dashboard.

### 4. Interactive Scrapes
Paste a job listing link (e.g. from LinkedIn or Indeed) into the **Smart URL Scan** tab. The scraping crawler will auto-fetch the job title, company name, location, and description, pre-populate the input fields, switch to the manual tab, and automatically trigger the ML threat analysis.
