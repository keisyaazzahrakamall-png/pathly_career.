import { saveCareerJourney } from "./lib/user-data.js";
import {
    CUSTOM_CAREERS_STORAGE_KEY,
    LEGACY_CUSTOM_CAREER_STORAGE_KEY,
    coerceCustomCareerCollection,
    removeCustomCareer,
    upsertCustomCareer
} from "./lib/custom-career-collection.js";
import {
    containsUnsafeCareerInput,
    sanitizeCareerName
} from "./lib/input-safety.js";

(function () {
    
    function createCareer(
        name,
        symbol,
        description,
        focus,
        skills,
        preferences
    ) {
        return {
            name: name,
            symbol: symbol,
            description: description,
            focus: focus,
            skills: skills,
            preferences: preferences
        };
    }

    function createGroup(
        id,
        name,
        aliases,
        keywords,
        suggestions
    ) {
        return {
            id: id,
            name: name,
            aliases: aliases,
            keywords: keywords,
            suggestions: suggestions
        };
    }

    const careerGroups = [
        createGroup(
            "hr",
            "Human Resources",
            ["hr", "human resources", "sumber daya manusia", "sdm"],
            ["recruit", "talent", "people", "employee", "hr"],
            [
                createCareer(
                    "Talent Acquisition Specialist",
                    "TA",
                    "Source and assess candidates for an organization's needs.",
                    "Sourcing, screening, interviewing, and employer branding",
                    [
                        "Recruitment Process",
                        "Candidate Screening",
                        "Interviewing Skills",
                        "Talent Sourcing",
                        "Employer Branding",
                        "Communication"
                    ],
                    ["people", "communication"]
                ),

                createCareer(
                    "Learning & Development Specialist",
                    "LD",
                    "Design programs to develop employee skills.",
                    "Training, facilitation, evaluation, and development",
                    [
                        "Training Needs Analysis",
                        "Learning Design",
                        "Facilitation",
                        "Training Evaluation",
                        "Program Management",
                        "Communication"
                    ],
                    ["growth", "people"]
                ),

                createCareer(
                    "HR Operations Specialist",
                    "HO",
                    "Manage HR administration and operational processes.",
                    "HR administration, HRIS, policies, and employee services",
                    [
                        "HR Administration",
                        "HRIS",
                        "Employee Policies",
                        "Payroll Fundamentals",
                        "Document Management",
                        "Attention to Detail"
                    ],
                    ["process", "detail"]
                ),

                createCareer(
                    "People Analytics Specialist",
                    "PA",
                    "Use employee data to support decisions.",
                    "HR data analysis, dashboards, and workforce metrics",
                    [
                        "HR Data Analysis",
                        "Excel / Google Sheets",
                        "Data Visualization",
                        "HR Metrics",
                        "Analytical Thinking",
                        "Communicating Insights"
                    ],
                    ["data", "analysis"]
                )
            ]
        ),


        createGroup(
            "technology",
            "Information Technology",
            [
                "it",
                "teknologi",
                "teknologi informasi",
                "software",
                "programming"
            ],
            [
                "developer",
                "engineer",
                "programmer",
                "cyber",
                "cloud",
                "software",
                "it"
            ],
            [
                createCareer(
                    "Software Engineer",
                    "SE",
                    "Build, test, and maintain software.",
                    "Programming, testing, and application development",
                    [
                        "Programming Fundamentals",
                        "Data Structures",
                        "Git",
                        "Software Testing",
                        "System Design Fundamentals",
                        "Problem Solving"
                    ],
                    ["build", "analysis"]
                ),

                createCareer(
                    "Cybersecurity Analyst",
                    "CA",
                    "Protect systems and data from security risks.",
                    "Network security, monitoring, and incident response",
                    [
                        "Network Security",
                        "Threat Analysis",
                        "Incident Response",
                        "Security Monitoring",
                        "Risk Assessment",
                        "Technical Reporting"
                    ],
                    ["analysis", "detail"]
                ),

                createCareer(
                    "Cloud Engineer",
                    "CE",
                    "Build and manage cloud infrastructure.",
                    "Cloud, deployment, automation, and networking",
                    [
                        "Cloud Fundamentals",
                        "Linux",
                        "Networking",
                        "Infrastructure as Code",
                        "CI/CD",
                        "Monitoring"
                    ],
                    ["build", "process"]
                ),

                createCareer(
                    "IT Business Analyst",
                    "IB",
                    "Connect business needs with system solutions.",
                    "Requirements, business processes, documentation, and communication",
                    [
                        "Requirements Analysis",
                        "Process Mapping",
                        "BRD / FSD",
                        "UAT",
                        "SDLC",
                        "Stakeholder Communication"
                    ],
                    ["communication", "analysis"]
                )
            ]
        ),


        createGroup(
            "data",
            "Data",
            ["data", "analisis data", "data science"],
            [
                "data",
                "analytics",
                "scientist",
                "machine learning",
                "business intelligence"
            ],
            [
                createCareer(
                    "Data Analyst",
                    "DA",
                    "Turn data into insights for decisions.",
                    "Analysis, reporting, visualization, and business insights",
                    [
                        "SQL",
                        "Excel / Google Sheets",
                        "Data Analysis",
                        "Data Visualization",
                        "Analytical Thinking",
                        "Communication"
                    ],
                    ["data", "analysis"]
                ),

                createCareer(
                    "Data Scientist",
                    "DS",
                    "Use statistics and machine learning to make predictions.",
                    "Statistics, programming, machine learning, and experimentation",
                    [
                        "Python",
                        "Statistics",
                        "Data Preparation",
                        "Machine Learning",
                        "Model Evaluation",
                        "Data Storytelling"
                    ],
                    ["data", "build"]
                ),

                createCareer(
                    "Business Intelligence Analyst",
                    "BI",
                    "Build reports and dashboards for business performance.",
                    "Data warehousing, dashboards, KPIs, and analysis",
                    [
                        "SQL",
                        "Data Modeling",
                        "BI Tools",
                        "Dashboard Design",
                        "Business Metrics",
                        "Stakeholder Communication"
                    ],
                    ["data", "communication"]
                ),

                createCareer(
                    "Machine Learning Engineer",
                    "ML",
                    "Integrate machine learning models into products.",
                    "ML models, deployment, data pipelines, and monitoring",
                    [
                        "Python",
                        "Machine Learning",
                        "Data Pipeline",
                        "Model Deployment",
                        "API",
                        "MLOps Fundamentals"
                    ],
                    ["build", "data"]
                )
            ]
        ),


        createGroup(
            "marketing",
            "Marketing",
            ["marketing", "pemasaran", "digital marketing"],
            [
                "marketing",
                "brand",
                "content",
                "seo",
                "social media",
                "campaign"
            ],
            [
                createCareer(
                    "Digital Marketing Specialist",
                    "DM",
                    "Plan and optimize digital campaigns.",
                    "Digital ads, analytics, content, and optimization",
                    [
                        "Digital Campaign",
                        "Google Ads",
                        "Meta Ads",
                        "Analytics",
                        "SEO / SEM",
                        "Campaign Optimization"
                    ],
                    ["creative", "data"]
                ),

                createCareer(
                    "Content Strategist",
                    "CS",
                    "Plan content strategies around audience needs.",
                    "Audience research, content, storytelling, and evaluation",
                    [
                        "Content Strategy",
                        "Audience Research",
                        "Copywriting",
                        "Storytelling",
                        "Content Calendar",
                        "Content Analytics"
                    ],
                    ["creative", "communication"]
                ),

                createCareer(
                    "Brand Marketing Specialist",
                    "BM",
                    "Build a brand's identity and perception.",
                    "Brand positioning, market research, and campaigns",
                    [
                        "Brand Strategy",
                        "Market Research",
                        "Campaign Planning",
                        "Consumer Insight",
                        "Presentation",
                        "Project Management"
                    ],
                    ["creative", "communication"]
                ),

                createCareer(
                    "Performance Marketing Specialist",
                    "PM",
                    "Manage campaigns against performance targets.",
                    "Paid ads, conversion, experimentation, and budgets",
                    [
                        "Paid Advertising",
                        "Conversion Tracking",
                        "A/B Testing",
                        "Campaign Analytics",
                        "Budget Management",
                        "Data-driven Thinking"
                    ],
                    ["data", "analysis"]
                )
            ]
        ),


        createGroup(
            "finance",
            "Finance",
            ["finance", "keuangan", "accounting", "akuntansi"],
            [
                "finance",
                "financial",
                "account",
                "audit",
                "tax",
                "investment"
            ],
            [
                createCareer(
                    "Financial Analyst",
                    "FA",
                    "Analyze financial data for business decisions.",
                    "Statement analysis, budgeting, and forecasting",
                    [
                        "Financial Analysis",
                        "Excel",
                        "Financial Modeling",
                        "Budgeting",
                        "Forecasting",
                        "Business Communication"
                    ],
                    ["data", "analysis"]
                ),

                createCareer(
                    "Accountant",
                    "AC",
                    "Record and report financial transactions.",
                    "Record-keeping, reconciliation, reporting, and tax",
                    [
                        "Accounting Principles",
                        "Journal Entry",
                        "Financial Reporting",
                        "Reconciliation",
                        "Tax Fundamentals",
                        "Attention to Detail"
                    ],
                    ["detail", "process"]
                ),

                createCareer(
                    "Internal Auditor",
                    "IA",
                    "Evaluate organizational controls, processes, and risks.",
                    "Auditing, internal controls, risk, and compliance",
                    [
                        "Audit Fundamentals",
                        "Internal Control",
                        "Risk Assessment",
                        "Data Analysis",
                        "Compliance",
                        "Audit Reporting"
                    ],
                    ["detail", "analysis"]
                ),

                createCareer(
                    "Investment Analyst",
                    "IN",
                    "Assess investment opportunities using market data.",
                    "Research, valuation, market analysis, and risk",
                    [
                        "Investment Research",
                        "Valuation",
                        "Financial Statements",
                        "Market Analysis",
                        "Risk Analysis",
                        "Report Writing"
                    ],
                    ["data", "analysis"]
                )
            ]
        ),


        createGroup(
            "design",
            "Design",
            ["design", "desain", "creative", "kreatif"],
            [
                "design",
                "designer",
                "creative",
                "visual",
                "ui",
                "ux"
            ],
            [
                createCareer(
                    "UI/UX Designer",
                    "UX",
                    "Design digital experiences that are easy to use.",
                    "Research, user flows, wireframes, and testing",
                    [
                        "Figma",
                        "UX Research",
                        "User Flows",
                        "Wireframing",
                        "Prototyping",
                        "Usability Testing"
                    ],
                    ["creative", "analysis"]
                ),

                createCareer(
                    "Graphic Designer",
                    "GD",
                    "Communicate ideas through visual design.",
                    "Layout, typography, color, and design production",
                    [
                        "Visual Design",
                        "Typography",
                        "Layout",
                        "Color Theory",
                        "Adobe / Design Tools",
                        "Creative Communication"
                    ],
                    ["creative", "detail"]
                ),

                createCareer(
                    "Product Designer",
                    "PD",
                    "Design products around user and business needs.",
                    "Research, interaction design, and prototyping",
                    [
                        "Product Thinking",
                        "User Research",
                        "Interaction Design",
                        "Prototyping",
                        "Design System",
                        "Collaboration"
                    ],
                    ["creative", "build"]
                ),

                createCareer(
                    "Motion Graphic Designer",
                    "MG",
                    "Create motion-based visual communication.",
                    "Animation, editing, and visual storytelling",
                    [
                        "Motion Design",
                        "Animation Principles",
                        "Video Editing",
                        "Visual Storytelling",
                        "Compositing",
                        "Creative Tools"
                    ],
                    ["creative", "build"]
                )
            ]
        ),


        createGroup(
            "business",
            "Business and Management",
            ["business", "bisnis", "management", "manajemen"],
            [
                "business",
                "manager",
                "management",
                "product",
                "sales",
                "operation"
            ],
            [
                createCareer(
                    "Business Development Specialist",
                    "BD",
                    "Identify business growth and partnership opportunities.",
                    "Market research, prospecting, negotiation, and partnerships",
                    [
                        "Market Research",
                        "Lead Generation",
                        "Partnership",
                        "Negotiation",
                        "Business Presentation",
                        "Relationship Management"
                    ],
                    ["communication", "growth"]
                ),

                createCareer(
                    "Product Manager",
                    "PM",
                    "Guide a product's development.",
                    "Strategy, user research, prioritization, and coordination",
                    [
                        "Product Strategy",
                        "User Research",
                        "Roadmapping",
                        "Prioritization",
                        "Data Analysis",
                        "Stakeholder Management"
                    ],
                    ["build", "communication"]
                ),

                createCareer(
                    "Operations Specialist",
                    "OS",
                    "Improve the effectiveness of operational processes.",
                    "Processes, coordination, quality, and documentation",
                    [
                        "Process Management",
                        "SOP",
                        "Project Coordination",
                        "Quality Control",
                        "Data Reporting",
                        "Problem Solving"
                    ],
                    ["process", "detail"]
                ),

                createCareer(
                    "Sales Executive",
                    "SA",
                    "Build relationships with prospective customers.",
                    "Prospecting, presentations, negotiation, and pipelines",
                    [
                        "Prospecting",
                        "Needs Analysis",
                        "Sales Presentation",
                        "Negotiation",
                        "CRM",
                        "Relationship Building"
                    ],
                    ["people", "communication"]
                )
            ]
        ),


        createGroup(
            "education",
            "Education",
            ["education", "pendidikan", "teaching", "guru"],
            [
                "teacher",
                "lecturer",
                "trainer",
                "education",
                "learning",
                "guru",
                "dosen"
            ],
            [
                createCareer(
                    "Teacher",
                    "TE",
                    "Design and facilitate learning.",
                    "Planning, teaching, assessment, and classroom management",
                    [
                        "Lesson Planning",
                        "Teaching Methods",
                        "Classroom Management",
                        "Student Assessment",
                        "Communication",
                        "Learning Media"
                    ],
                    ["people", "growth"]
                ),

                createCareer(
                    "Instructional Designer",
                    "ID",
                    "Design learning materials and experiences.",
                    "Learning design, media, assessment, and evaluation",
                    [
                        "Learning Needs Analysis",
                        "Instructional Design",
                        "Curriculum Design",
                        "Learning Media",
                        "Assessment Design",
                        "Evaluation"
                    ],
                    ["creative", "growth"]
                ),

                createCareer(
                    "Corporate Trainer",
                    "CT",
                    "Deliver training to improve employee skills.",
                    "Facilitation, materials, presentations, and evaluation",
                    [
                        "Training Delivery",
                        "Facilitation",
                        "Presentation",
                        "Training Materials",
                        "Participant Engagement",
                        "Training Evaluation"
                    ],
                    ["communication", "growth"]
                ),

                createCareer(
                    "Education Program Officer",
                    "EP",
                    "Manage education programs from planning to evaluation.",
                    "Programs, coordination, monitoring, and partnerships",
                    [
                        "Program Planning",
                        "Project Coordination",
                        "Monitoring & Evaluation",
                        "Stakeholder Communication",
                        "Reporting",
                        "Partnership"
                    ],
                    ["process", "people"]
                )
            ]
        )
    ];

    const preferenceOptions = [
        {
            id: "people",
            label: "Interacting with people"
        },
        {
            id: "data",
            label: "Analyzing data and patterns"
        },
        {
            id: "creative",
            label: "Creating ideas or visuals"
        },
        {
            id: "process",
            label: "Organizing processes"
        },
        {
            id: "build",
            label: "Building products or solutions"
        },
        {
            id: "growth",
            label: "Helping people or businesses grow"
        }
    ];

    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9/ &+-]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function sanitizeCareerData(data) {
        const rawName = data?.career?.name;

        if (
            typeof rawName !== "string" ||
            containsUnsafeCareerInput(rawName)
        ) {
            return null;
        }

        const safeName = sanitizeCareerName(rawName);

        if (safeName.length < 2) {
            return null;
        }
        return buildCareer(safeName);
    }

    function createId(name) {
        const id = normalize(name)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        return `custom-${id}`;
    }

    function createSymbol(name) {
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(function (word) {
                return word[0].toUpperCase();
            })
            .join("");
    }

    function formatTitle(value) {
        const uppercaseTerms = [
            "hr",
            "it",
            "ui",
            "ux",
            "ui/ux",
            "seo",
            "sem",
            "qa"
        ];

        return value
            .trim()
            .split(/\s+/)
            .map(function (word) {
                if (uppercaseTerms.includes(word.toLowerCase())) {
                    return word.toUpperCase();
                }

                return (
                    word.charAt(0).toUpperCase() +
                    word.slice(1).toLowerCase()
                );
            })
            .join(" ");
    }

    function findBroadGroup(input) {
        const normalizedInput = normalize(input);

        return careerGroups.find(function (group) {
            return group.aliases.includes(normalizedInput);
        });
    }

    function inferGroup(input) {
        const normalizedInput = normalize(input);

        return careerGroups.find(function (group) {
            const terms = group.aliases.concat(group.keywords);

            return terms.some(function (term) {
                return normalizedInput.includes(term);
            });
        });
    }

    function findBestTemplate(input, group) {
        if (!group) {
            return null;
        }

        const normalizedInput = normalize(input);

        const exactMatch = group.suggestions.find(
            function (suggestion) {
                return (
                    normalize(suggestion.name) === normalizedInput
                );
            }
        );

        if (exactMatch) {
            return exactMatch;
        }

        return group.suggestions.find(function (suggestion) {
            return normalize(suggestion.name)
                .split(" ")
                .some(function (word) {
                    return (
                        word.length > 4 &&
                        normalizedInput.includes(word)
                    );
                });
        });
    }

    function buildRequirements(skills) {
        return skills.map(function (skill, index) {
            const isCore = index < 4;

            return {
                skill: skill,
                importance: isCore ? "Core" : "Important",
                weight: isCore ? 3 : 2,
                targetLevel: isCore ? 2 : 1
            };
        });
    }

    function buildCareer(name, template) {
        const safeName = sanitizeCareerName(name);

        if (safeName.length < 2 || containsUnsafeCareerInput(name)) {
            return null;
        }

        const formattedName = formatTitle(safeName);

        const templateGroup = template
            ? careerGroups.find(function (group) {
                return group.suggestions.includes(template);
            })
            : null;

        const group =
            templateGroup || inferGroup(formattedName);

        const selectedTemplate =
            template || findBestTemplate(formattedName, group);

        const fallbackSkills = [
            `${formattedName} Fundamentals`,
            `${formattedName} Technical Skills`,
            "Problem Solving",
            "Professional Communication",
            "Time Management",
            "Collaboration"
        ];

        const skills = selectedTemplate
            ? [...selectedTemplate.skills]
            : fallbackSkills;

        const career = {
            id: createId(formattedName),
            name: formattedName,
            category: group
                ? group.name.toUpperCase()
                : "YOUR CHOICE",
            symbol: selectedTemplate
                ? selectedTemplate.symbol
                : createSymbol(formattedName),
            description: selectedTemplate
                ? selectedTemplate.description
                : `Develop relevant skills to grow as a ${formattedName}.`,
            focus: selectedTemplate
                ? selectedTemplate.focus
                : "Domain knowledge, technical skills, problem solving, and communication",
            skills: skills,
            isCustom: true
        };

        return {
            career: career,
            requirements: buildRequirements(skills)
        };
    }

    function readStoredCareers() {
        const storedCollection = localStorage.getItem(
            CUSTOM_CAREERS_STORAGE_KEY
        );
        const storedLegacyCareer = localStorage.getItem(
            LEGACY_CUSTOM_CAREER_STORAGE_KEY
        );
        const rawValue = storedCollection || storedLegacyCareer;

        if (!rawValue) {
            return {
                careers: [],
                needsMigration: false
            };
        }

        try {
            const parsedValue = JSON.parse(rawValue);
            const safeCareers = [];

            coerceCustomCareerCollection(parsedValue).forEach(
                function (careerData) {
                    const safeData = sanitizeCareerData(careerData);
                    const careerId = safeData?.career?.id;

                    if (
                        safeData &&
                        !safeCareers.some(function (item) {
                            return item.career.id === careerId;
                        })
                    ) {
                        safeCareers.push(safeData);
                    }
                }
            );

            return {
                careers: safeCareers,
                needsMigration:
                    Boolean(storedLegacyCareer) ||
                    JSON.stringify(
                        coerceCustomCareerCollection(parsedValue)
                    ) !== JSON.stringify(safeCareers)
            };
        } catch (error) {
            console.log(
                "Could not read custom career data:",
                error
            );

            return {
                careers: [],
                needsMigration: true
            };
        }
    }

    function persistStoredCareers(careerCollection) {
        const safeCollection = coerceCustomCareerCollection(
            careerCollection
        );

        if (safeCollection.length) {
            localStorage.setItem(
                CUSTOM_CAREERS_STORAGE_KEY,
                JSON.stringify(safeCollection)
            );
        } else {
            localStorage.removeItem(CUSTOM_CAREERS_STORAGE_KEY);
        }

        localStorage.removeItem(LEGACY_CUSTOM_CAREER_STORAGE_KEY);

        saveCareerJourney({
            custom_career: safeCollection.length
                ? safeCollection
                : null
        });
    }

    function registerCareer(data) {
        data = sanitizeCareerData(data);

        if (
            !data ||
            !data.career ||
            !Array.isArray(data.requirements)
        ) {
            return null;
        }

        window.PATHLY_CAREERS =
            window.PATHLY_CAREERS || [];

        const careers = window.PATHLY_CAREERS;

        const builtInCareer = careers.find(function (career) {
            return (
                !career.isCustom &&
                normalize(career.name) === normalize(data.career.name)
            );
        });

        if (builtInCareer) {
            const journeyChanges = {};
            const oldCareerId = data.career.id;

            if (localStorage.getItem("pathlyCareerTarget") === oldCareerId) {
                localStorage.setItem("pathlyCareerTarget", builtInCareer.id);
                journeyChanges.target_career_id = builtInCareer.id;
                journeyChanges.target_career_name = builtInCareer.name;
            }

            try {
                const savedComparison = JSON.parse(
                    localStorage.getItem("pathlyComparedCareers") || "[]"
                );

                if (Array.isArray(savedComparison)) {
                    const migratedComparison = Array.from(
                        new Set(
                            savedComparison.map(function (careerId) {
                                return careerId === oldCareerId
                                    ? builtInCareer.id
                                    : careerId;
                            })
                        )
                    );

                    if (
                        JSON.stringify(migratedComparison) !==
                        JSON.stringify(savedComparison)
                    ) {
                        localStorage.setItem(
                            "pathlyComparedCareers",
                            JSON.stringify(migratedComparison)
                        );
                        journeyChanges.compared_career_ids = migratedComparison;
                    }
                }
            } catch (error) {
                localStorage.removeItem("pathlyComparedCareers");
            }

            if (Object.keys(journeyChanges).length) {
                saveCareerJourney(journeyChanges);
            }

            return builtInCareer;
        }

        const existingCustomIndex = careers.findIndex(
            function (career) {
                return (
                    career.isCustom &&
                    career.id === data.career.id
                );
            }
        );

        if (existingCustomIndex >= 0) {
            careers.splice(existingCustomIndex, 1);
        }

        careers.unshift(data.career);

        if (window.PATHLY_REQUIREMENTS) {
            window.PATHLY_REQUIREMENTS[data.career.id] =
                data.requirements;
        }

        return data.career;
    }

    function saveCareer(data) {
        data = sanitizeCareerData(data);

        if (!data) {
            return null;
        }

        const registeredCareer = registerCareer(data);

        if (!registeredCareer) {
            return null;
        }

        const storedCareers = readStoredCareers().careers;
        const updatedCareers = registeredCareer.isCustom
            ? upsertCustomCareer(storedCareers, data)
            : removeCustomCareer(
                storedCareers,
                data.career.id
            );

        persistStoredCareers(updatedCareers);

        return registeredCareer;
    }

    function loadStoredCareers() {
        const stored = readStoredCareers();
        const retainedCareerIds = new Set();

        [...stored.careers]
            .reverse()
            .forEach(function (careerData) {
                const registeredCareer = registerCareer(careerData);

                if (registeredCareer?.isCustom) {
                    retainedCareerIds.add(careerData.career.id);
                }
            });

        const retainedCareers = stored.careers.filter(
            function (careerData) {
                return retainedCareerIds.has(careerData.career.id);
            }
        );

        if (
            stored.needsMigration ||
            retainedCareers.length !== stored.careers.length
        ) {
            persistStoredCareers(retainedCareers);
        }
    }

    function recommend(group, preference) {
        return (
            group.suggestions.find(function (suggestion) {
                return suggestion.preferences.includes(preference);
            }) || group.suggestions[0]
        );
    }

    window.PATHLY_CUSTOM_CAREER_ENGINE = {
        groups: careerGroups,
        preferenceOptions: preferenceOptions,
        normalize: normalize,
        containsUnsafeInput: containsUnsafeCareerInput,
        sanitizeName: sanitizeCareerName,
        findBroadGroup: findBroadGroup,
        inferGroup: inferGroup,
        buildCareer: buildCareer,
        saveCareer: saveCareer,
        registerCareer: registerCareer,
        recommend: recommend
    };

    loadStoredCareers();
})();
