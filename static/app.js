// ============================================================
// ScamShield - Main Application Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM References
    const form = document.getElementById('prediction-form');
    const submitBtn = document.getElementById('btn-submit');
    const idleState = document.getElementById('results-idle');
    const loadingState = document.getElementById('results-loading');
    const activeState = document.getElementById('results-active');

    // Gauge variables
    const fillCircle = document.getElementById('gauge-fill-circle');
    const circumference = 2 * Math.PI * 50; // 314.159
    fillCircle.style.strokeDasharray = `${circumference} ${circumference}`;

    // ============================================================
    // Theme Toggle Logic
    // ============================================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Check saved theme or preference
    const savedTheme = localStorage.getItem('scamshield-theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
        document.body.classList.add('light-theme');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem('scamshield-theme', currentTheme);
    });

    // ============================================================
    // Tab Switching Logic
    // ============================================================
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Toggle active buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle active contents
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // ============================================================
    // Linear Pipeline Animation Logic
    // ============================================================
    let pipelineInterval = null;
    
    function startPipelineLoading() {
        const steps = document.querySelectorAll('.pipeline-track .step');
        steps.forEach((step, idx) => {
            step.className = 'step';
            if (idx === 0) step.classList.add('active'); // Ingested active
        });

        let currentStep = 0;
        if (pipelineInterval) clearInterval(pipelineInterval);
        
        pipelineInterval = setInterval(() => {
            if (currentStep < 5) { // Stop at step 6 (Trust Score) during loading
                steps[currentStep].classList.remove('active');
                steps[currentStep].classList.add('completed');
                currentStep++;
                steps[currentStep].classList.add('active');
            } else {
                clearInterval(pipelineInterval);
            }
        }, 250);
    }

    function finalizePipelineStates(details, prediction) {
        if (pipelineInterval) clearInterval(pipelineInterval);
        const steps = document.querySelectorAll('.pipeline-track .step');
        
        // Step 1: Ingested always completed
        steps[0].className = 'step completed';
        
        // Step 2: NLP Analysis
        steps[1].className = `step ${getStepClass(details.nlp_status)}`;
        
        // Step 3: URL Scan
        steps[2].className = `step ${getStepClass(details.url_status)}`;
        
        // Step 4: Company Check
        steps[3].className = `step ${getStepClass(details.company_status)}`;
        
        // Step 5: Recruiter Check
        steps[4].className = `step ${getStepClass(details.recruiter_status)}`;
        
        // Step 6: Trust Score computed
        steps[5].className = 'step completed';
        
        // Step 7: Decision
        steps[6].className = prediction === 1 ? 'step failed' : 'step completed';
    }

    function getStepClass(status) {
        if (status === 'FAILED') return 'failed';
        if (status === 'WARNING') return 'warning';
        return 'completed';
    }

    // ============================================================
    // Trust Cards Content Rendering
    // ============================================================
    function updateTrustCard(cardId, badgeId, descId, status, reasons, defaultDesc) {
        const card = document.getElementById(cardId);
        const badge = document.getElementById(badgeId);
        const desc = document.getElementById(descId);

        badge.className = 'trust-badge';
        if (status === 'FAILED') {
            badge.classList.add('badge-failed');
            badge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Failed';
            card.style.borderColor = 'var(--danger-color)';
        } else if (status === 'WARNING') {
            badge.classList.add('badge-warning-status');
            badge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Warning';
            card.style.borderColor = 'var(--warning-color)';
        } else {
            badge.classList.add('badge-passed');
            badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Passed';
            card.style.borderColor = '';
        }

        if (reasons && reasons.length > 0) {
            desc.innerHTML = reasons.map(r => `• ${r}`).join('<br>');
        } else {
            desc.textContent = defaultDesc;
        }
    }

    // ============================================================
    // Risk/Trust Gauge Animation (High Trust = Green, Low Trust = Red)
    // ============================================================
    function setTrustGauge(score) {
        document.getElementById('risk-percentage-val').innerText = `${score}%`;
        const offset = circumference - (score / 100) * circumference;
        fillCircle.style.strokeDashoffset = offset;

        // Set dynamic colors based on trust score (Inverted from Risk)
        const gaugeContainer = document.querySelector('.gauge-container');
        if (score >= 80) {
            fillCircle.style.stroke = 'var(--success-color)';
            gaugeContainer.style.setProperty('--glow-color', 'var(--success-bg)');
        } else if (score >= 50) {
            fillCircle.style.stroke = 'var(--warning-color)';
            gaugeContainer.style.setProperty('--glow-color', 'var(--warning-bg)');
        } else {
            fillCircle.style.stroke = 'var(--danger-color)';
            gaugeContainer.style.setProperty('--glow-color', 'var(--danger-bg)');
        }
    }

    // ============================================================
    // Form Submission & Prediction
    // ============================================================
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Toggle loading and launch pipeline tracking
        idleState.classList.remove('active');
        activeState.classList.remove('active');
        loadingState.classList.add('active');
        startPipelineLoading();

        // Gather parameters
        const payload = {
            title: document.getElementById('title').value,
            location: document.getElementById('location').value,
            required_experience: document.getElementById('required_experience').value,
            required_education: document.getElementById('required_education').value,
            industry: document.getElementById('industry').value,
            function: document.getElementById('function').value,
            company_profile: document.getElementById('company_profile').value,
            description: document.getElementById('description').value,
            requirements: document.getElementById('requirements').value,
            benefits: document.getElementById('benefits').value,
            telecommuting: document.getElementById('telecommuting').checked ? 1 : 0,
            url: document.getElementById('url-input').value.trim()
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.status === 'success') {
                // Update Trust Score Gauge
                setTrustGauge(result.trust_score);

                // Finalize horizontal pipeline markers
                finalizePipelineStates(result.details, result.prediction);

                // Threat classifications
                const badge = document.getElementById('threat-badge');
                const threatTitle = document.getElementById('threat-title');
                const threatDesc = document.getElementById('threat-desc');
                const recBox = document.getElementById('rec-box');
                const recIcon = document.getElementById('rec-icon');
                const recTitle = document.getElementById('rec-title');
                const recDesc = document.getElementById('rec-desc');

                badge.className = 'badge';
                recBox.className = 'recommendation-box';

                if (result.prediction === 1) {
                    badge.innerText = 'LOW TRUST';
                    badge.classList.add('badge-danger');
                    threatTitle.innerText = 'Scam Vulnerability Alert';
                    threatDesc.innerText = 'Critical threat signals detected across NLP, company registration, and recruiter routing checks.';

                    recBox.classList.add('rec-danger');
                    recIcon.className = 'fa-solid fa-bell-slash rec-icon';
                    recTitle.innerText = 'Application Blocked';
                    recDesc.innerText = 'This job description exhibits confirmed phishing patterns. Do NOT submit personal credentials or payment details.';
                } else if (result.trust_score < 80) {
                    badge.innerText = 'NEUTRAL RISK';
                    badge.classList.add('badge-warning');
                    threatTitle.innerText = 'Minor Warning Signs';
                    threatDesc.innerText = 'Some parameters flagged minor warnings, but did not trigger low-trust blocking thresholds.';

                    recBox.classList.add('rec-warning');
                    recIcon.className = 'fa-solid fa-circle-exclamation rec-icon';
                    recTitle.innerText = 'Cross-Verification Advised';
                    recDesc.innerText = 'Conduct secondary verification on the official company portal before submitting an application.';
                } else {
                    badge.innerText = 'HIGH TRUST';
                    badge.classList.add('badge-success');
                    threatTitle.innerText = 'Passed Verification';
                    threatDesc.innerText = 'This posting satisfies all validation checks and matches legitimate hiring profile parameters.';

                    recBox.classList.add('rec-success');
                    recIcon.className = 'fa-solid fa-circle-check rec-icon';
                    recTitle.innerText = 'Safe to Apply';
                    recDesc.innerText = 'No threat signatures detected. Job description meets standard operational trust guidelines.';
                }

                // Render Trust Cards contents
                updateTrustCard(
                    'trust-card-nlp', 'trust-badge-nlp', 'trust-desc-nlp',
                    result.details.nlp_status, result.details.nlp_reasons,
                    "Language structures and vocabulary match secure patterns."
                );
                updateTrustCard(
                    'trust-card-url', 'trust-badge-url', 'trust-desc-url',
                    result.details.url_status, result.details.url_reasons,
                    "SSL secure domain connection verified with no blacklist hits."
                );
                updateTrustCard(
                    'trust-card-company', 'trust-badge-company', 'trust-desc-company',
                    result.details.company_status, result.details.company_reasons,
                    "Corporate details validated against registries and active profiles."
                );
                updateTrustCard(
                    'trust-card-recruiter', 'trust-badge-recruiter', 'trust-desc-recruiter',
                    result.details.recruiter_status, result.details.recruiter_reasons,
                    "Recruitment routing paths and listing templates are within compliance."
                );

                // Technical stats details (Fine Print Drawer)
                document.getElementById('stat-text-model').innerText = result.details.text_classification_fraud ? 'SUSPICIOUS' : 'CLEAN';
                document.getElementById('stat-text-model').className = result.details.text_classification_fraud ? 'text-danger' : 'text-success';

                document.getElementById('stat-meta-model').innerText = result.details.numerical_features_fraud ? 'SUSPICIOUS' : 'CLEAN';
                document.getElementById('stat-meta-model').className = result.details.numerical_features_fraud ? 'text-danger' : 'text-success';

                document.getElementById('stat-location-ratio').innerText = `${result.details.location_ratio.toFixed(2)}:1`;
                document.getElementById('stat-location-ratio').className = result.details.location_ratio >= 1.0 ? 'text-danger' : (result.details.location_ratio > 0 ? 'text-warning' : 'text-success');

                document.getElementById('stat-char-count').innerText = result.details.character_count;

                // Reasons lists logs
                const reasonsList = document.getElementById('reasons-list');
                reasonsList.innerHTML = '';
                if (result.reasons.length === 0) {
                    reasonsList.innerHTML = '<li><i class="fa-solid fa-shield-check text-success"></i> All trust engine parameters successfully cleared validation checks.</li>';
                } else {
                    result.reasons.forEach(reason => {
                        const li = document.createElement('li');
                        li.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-warning"></i> ${reason}`;
                        reasonsList.appendChild(li);
                    });
                }

                // Render Highlighted Job description text
                const descriptionText = document.getElementById('description').value;
                const highlightHtml = highlightText(
                    descriptionText, 
                    result.details.free_emails, 
                    result.details.corp_emails, 
                    result.details.location_ratio, 
                    payload.location, 
                    result.details.telecommuting
                );
                document.getElementById('highlighted-doc-box').innerHTML = highlightHtml;

                // Switch states
                loadingState.classList.remove('active');
                activeState.classList.add('active');
            } else {
                alert('Prediction failed. Error: ' + result.message);
                loadingState.classList.remove('active');
                idleState.classList.add('active');
            }
        } catch (err) {
            console.error(err);
            alert('Connection to server lost. Make sure backend app is running.');
            loadingState.classList.remove('active');
            idleState.classList.add('active');
        }
    });

    // ============================================================
    // Dataset Templates
    // ============================================================
    const realTemplate = {
        title: "Marketing Intern",
        location: "US, NY, New York",
        required_experience: "Internship",
        required_education: "Unspecified",
        industry: "Marketing and Advertising",
        function: "Marketing",
        company_profile: "We're Food52, and we've created a groundbreaking and award-winning cooking site. We support, connect, and celebrate home cooks, and give them everything they need in one place.We have a top editorial, business, and engineering team. We're focused on using technology to find new and better ways to connect people around their specific food interests, and to offer them superb, highly curated information about food and cooking. We attract the most talented home cooks and contributors in the country; we also publish well-known professionals like Mario Batali, Gwyneth Paltrow, and Danny Meyer.",
        description: "Food52, a fast-growing, James Beard Award-winning online food community and crowd-sourced and curated recipe hub, is currently interviewing full- and part-time unpaid interns to work in a small team of editors, executives, and developers in its New York City headquarters. Reproducing and/or repackaging existing Food52 content for a number of partner sites, such as Huffington Post, Yahoo, Buzzfeed, and more in their various content management systems. Researching blogs and websites for the Provisions by Food52 Affiliate Program. Assisting in day-to-day affiliate program support.",
        requirements: "Experience with content management systems a major plus (any blogging counts!). Familiar with the Food52 editorial voice and aesthetic. Loves food, appreciates the importance of home cooking and cooking with the seasons. Meticulous editor, perfectionist, obsessive attention to detail, maddened by typos and broken links, delighted by finding and fixing them. Cheerful under pressure. Excellent communication skills.",
        benefits: "Unpaid internship with college credit, mentoring from executives, and delicious food/tastings in our test kitchen.",
        telecommuting: false,
        url: "https://www.food52.com/careers/internship"
    };

    const fakeTemplate = {
        title: "IC&E Technician",
        location: "US, CA, Bakersfield",
        required_experience: "Mid-Senior level",
        required_education: "High School or equivalent",
        industry: "Oil & Energy",
        function: "Other",
        company_profile: "Staffing & Recruiting done right for the Oil & Energy Industry! Represented candidates are automatically granted the following perks: Expert negotiations on your behalf, maximizing your compensation package and implementing ongoing increases. Significant signing bonus by Refined Resources. 1 Year access to AnyPerk: significant corporate discounts on cell phones, event tickets, house cleaning and everything in between.",
        description: "IC&E Technician | Bakersfield, CA Mt. Poso. Principal Duties and Responsibilities: Calibrates, tests, maintains, troubleshoots, and installs all power plant instrumentation, control systems and electrical equipment. Performs maintenance on motor control centers, motor operated valves, generators, excitation equipment and motors. Performs preventive, predictive and corrective maintenance on equipment.",
        requirements: "A high school diploma or GED is required. Must have a valid driver's license. Ability to read, write, and communicate effectively in English. Good math skills. Four years of experience as an I&C Technician and/or Electrician in a power plant environment, preferably with a strong electrical background.",
        benefits: "What is offered: Competitive compensation package, 100% matched retirement fund, Annual vacations paid for by company, Significant bonus structure, Opportunity for advancement, Full benefits package, Annual performance reviews and base salary increases, Annual cost of living increases.",
        telecommuting: false,
        url: "http://refinedresources-jobs.blogspot.com/bakersfield/ice-tech"
    };

    document.getElementById('btn-load-real').addEventListener('click', () => {
        loadTemplate(realTemplate);
    });

    document.getElementById('btn-load-fake').addEventListener('click', () => {
        loadTemplate(fakeTemplate);
    });

    function loadTemplate(data) {
        document.getElementById('title').value = data.title;
        document.getElementById('location').value = data.location;
        document.getElementById('required_experience').value = data.required_experience;
        document.getElementById('required_education').value = data.required_education;
        document.getElementById('industry').value = data.industry;
        document.getElementById('function').value = data.function;
        document.getElementById('company_profile').value = data.company_profile;
        document.getElementById('description').value = data.description;
        document.getElementById('requirements').value = data.requirements;
        document.getElementById('benefits').value = data.benefits;
        document.getElementById('telecommuting').checked = data.telecommuting;
        document.getElementById('url-input').value = data.url;

        // Switch to the form input tab so the user sees the template load
        const manualTabBtn = document.querySelector('[data-tab="manual-form-tab"]');
        if (manualTabBtn) {
            manualTabBtn.click();
        }

        // Flash effect to show it loaded
        const card = document.querySelector('.form-card');
        card.style.borderColor = 'var(--primary-accent)';
        setTimeout(() => {
            card.style.borderColor = '';
        }, 600);
    }

    // ============================================================
    // URL Scanner Logic
    // ============================================================
    const urlInput = document.getElementById('url-input');
    const btnScan = document.getElementById('btn-scan-url');
    const urlStatus = document.getElementById('url-scanner-status');
    const urlStatusText = document.getElementById('url-status-text');

    btnScan.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            urlInput.focus();
            urlInput.style.borderColor = 'var(--danger-color)';
            setTimeout(() => { urlInput.style.borderColor = ''; }, 1500);
            return;
        }

        // Show loading state
        btnScan.disabled = true;
        btnScan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scanning...';
        urlStatus.style.display = 'flex';
        urlStatusText.textContent = 'Fetching page content...';
        urlStatus.className = 'url-scanner-status status-loading';

        try {
            const response = await fetch('/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });
            const result = await response.json();

            if (result.status === 'success') {
                const d = result.data;

                // Auto-fill the form fields
                document.getElementById('title').value = d.title || '';
                document.getElementById('location').value = d.location || '';
                document.getElementById('company_profile').value = d.company_profile || '';
                document.getElementById('description').value = d.description || '';
                document.getElementById('requirements').value = d.requirements || '';
                document.getElementById('benefits').value = d.benefits || '';
                document.getElementById('industry').value = d.industry || '';
                document.getElementById('function').value = d.function || '';
                document.getElementById('telecommuting').checked = !!d.telecommuting;

                // Try to match experience/education selects
                if (d.required_experience) {
                    const expSelect = document.getElementById('required_experience');
                    for (let opt of expSelect.options) {
                        if (opt.value && d.required_experience.toLowerCase().includes(opt.value.toLowerCase())) {
                            expSelect.value = opt.value;
                            break;
                        }
                    }
                }
                if (d.required_education) {
                    const eduSelect = document.getElementById('required_education');
                    for (let opt of eduSelect.options) {
                        if (opt.value && d.required_education.toLowerCase().includes(opt.value.toLowerCase())) {
                            eduSelect.value = opt.value;
                            break;
                        }
                    }
                }

                // Success state
                urlStatus.className = 'url-scanner-status status-success';
                urlStatusText.textContent = `Page scraped successfully! Fields auto-filled from: ${d.source_url}`;

                // Switch to manual input tab to show the filled form fields
                const manualTabBtn = document.querySelector('[data-tab="manual-form-tab"]');
                if (manualTabBtn) {
                    manualTabBtn.click();
                }

                // Flash the form
                const card = document.querySelector('.form-card');
                card.style.borderColor = 'var(--success-color)';
                setTimeout(() => { card.style.borderColor = ''; }, 1200);

                // Auto-trigger analysis after short delay
                setTimeout(() => {
                    form.dispatchEvent(new Event('submit'));
                }, 800);
            } else {
                urlStatus.className = 'url-scanner-status status-error';
                urlStatusText.textContent = result.message || 'Failed to scrape the URL.';
            }
        } catch (err) {
            console.error(err);
            urlStatus.className = 'url-scanner-status status-error';
            urlStatusText.textContent = 'Connection error. Make sure the backend is running.';
        } finally {
            btnScan.disabled = false;
            btnScan.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Scan Link';
        }
    });

    // Allow Enter key in URL input to trigger scan
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnScan.click();
        }
    });
});

function highlightText(text, freeEmails, corpEmails, locationRatio, locationName, telecommuting) {
    if (!text) return "<em>No description text provided.</em>";

    // Escape HTML to prevent XSS
    let escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Define Highlight Patterns
    // Category 1: High Risk (Payment, crypto, wire transfer, buy equipment, Telegram, WhatsApp, Sign-up fee, etc.)
    const highRiskKeywords = [
        /\b(telegram|whatsapp|signal|kik|google hangouts)\b/gi,
        /\b(wire transfer|bank account|bank details|credit card|upfront fee|processing fee|sign-up fee|security deposit|refundable fee)\b/gi,
        /\b(buy equipment|reimburse|cashier\'s check|money transfer|western union|moneygram)\b/gi,
        /\b(package handler|re-shipper|envelope stuffer|work from home agent)\b/gi,
        /\b(bitcoin|cryptocurrency|crypto|cash app|venmo|paypal)\b/gi
    ];

    // Category 2: Warning (Urgency, free emails, pressure words, blogspot/free domains)
    const warningKeywords = [
        /\b(urgent|urgently|immediate|immediately|act now|apply today|fast cash|quick cash)\b/gi,
        /\b(no experience required|no experience needed|make money fast|easy money)\b/gi
    ];

    // Apply Free Email highlights if any are present
    if (freeEmails && freeEmails.length > 0) {
        freeEmails.forEach(email => {
            const escapedDomain = email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`[\\w\\.-]+@${escapedDomain}`, 'gi');
            escapedText = escapedText.replace(regex, (match) => {
                return `<span class="hl-warning" title="Warning: Suspicious free contact domain">${match}</span>`;
            });
        });
    }

    // Apply Corporate Email highlights
    if (corpEmails && corpEmails.length > 0) {
        corpEmails.forEach(email => {
            const escapedDomain = email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
            const regex = new RegExp(`[\\w\\.-]+@${escapedDomain}`, 'gi');
            escapedText = escapedText.replace(regex, (match) => {
                return `<span class="hl-info" title="Verified Corporate domain">${match}</span>`;
            });
        });
    }

    // Highlight High Risk phrases
    highRiskKeywords.forEach(regex => {
        escapedText = escapedText.replace(regex, (match) => {
            return `<span class="hl-danger" title="High Risk: Fraud-associated term">${match}</span>`;
        });
    });

    // Highlight Warning phrases
    warningKeywords.forEach(regex => {
        escapedText = escapedText.replace(regex, (match) => {
            return `<span class="hl-warning" title="Warning: Urgency or low-effort signal">${match}</span>`;
        });
    });

    // Category 3: Info Highlights (Telecommuting, location if ratio is high)
    if (telecommuting === 1) {
        const telecommuteRegex = /\b(remote|work from home|telecommute|work-from-home|wfh)\b/gi;
        escapedText = escapedText.replace(telecommuteRegex, (match) => {
            return `<span class="hl-info" title="Info: Telecommuting is allowed (elevated correlation to scams)">${match}</span>`;
        });
    }

    if (locationRatio >= 1.0 && locationName) {
        const locClean = locationName.split(',').map(s => s.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).filter(s => s.length > 2);
        locClean.forEach(locPart => {
            const locRegex = new RegExp(`\\b${locPart}\\b`, 'gi');
            escapedText = escapedText.replace(locRegex, (match) => {
                return `<span class="hl-info" title="Info: High-Scam Location (${locationRatio.toFixed(1)}:1 ratio)">${match}</span>`;
            });
        });
    }

    return escapedText;
}
