import { supabase } from "./lib/supabase.js";
import { saveCareerJourney } from "./lib/user-data.js";

console.log("Pathly is running!");

function getSavedData(key) {
    const savedData = localStorage.getItem(key);

    if (!savedData) {
        return null;
    }

    try {
        return JSON.parse(savedData);
    } catch (error) {
        console.log("Could not read saved data:", error);
        return null;
    }
}

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");

if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
        navLinks.classList.toggle("active");

        const isOpen = navLinks.classList.contains("active");

        menuButton.setAttribute("aria-expanded", isOpen);
        menuButton.textContent = isOpen ? "×" : "☰";
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("active");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.textContent = "☰";
        });
    });
}

const sectionNavLinks = navLinks
    ? Array.from(navLinks.querySelectorAll('a[href^="#"]'))
    : [];
const observedSections = sectionNavLinks
    .map(function (link) {
        return {
            link: link,
            section: document.querySelector(link.getAttribute("href"))
        };
    })
    .filter(function (item) {
        return item.section;
    });

if (observedSections.length) {
    let scrollUpdateQueued = false;

    function updateActiveSection() {
        const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 0;
        const readingLine = window.scrollY + navbarHeight + window.innerHeight * 0.22;
        let activeItem = null;

        observedSections.forEach(function (item) {
            if (item.section.offsetTop <= readingLine) {
                activeItem = item;
            }
        });

        observedSections.forEach(function (item) {
            const isActive = item === activeItem;
            item.link.classList.toggle("is-active", isActive);

            if (isActive) {
                item.link.setAttribute("aria-current", "location");
            } else {
                item.link.removeAttribute("aria-current");
            }
        });

        scrollUpdateQueued = false;
    }

    function requestActiveSectionUpdate() {
        if (scrollUpdateQueued) return;
        scrollUpdateQueued = true;
        window.requestAnimationFrame(updateActiveSection);
    }

    window.addEventListener("scroll", requestActiveSectionUpdate, { passive: true });
    window.addEventListener("resize", requestActiveSectionUpdate);
    updateActiveSection();
}

const profileForm = document.getElementById("profileForm");
const formMessage = document.getElementById("formMessage");

if (profileForm) {
    const profileParams = new URLSearchParams(window.location.search);
    const isEditingProfile = profileParams.get("edit") === "profile";
    const profileReturnPage = "index.html";
    const fullNameInput = document.getElementById("fullName");
    const majorInput = document.getElementById("major");
    const semesterInput = document.getElementById("semester");
    const graduationInput = document.getElementById("graduationYear");
    const profileSubmitButton = profileForm.querySelector('button[type="submit"]');
    const educationInputs = Array.from(
        profileForm.querySelectorAll('input[name="educationLevel"]')
    );
    const experienceInputs = Array.from(
        profileForm.querySelectorAll('input[name="experience"]')
    );
    const noExperienceInput = profileForm.querySelector('[data-no-experience]');

    if (isEditingProfile) {
        document.getElementById("profilePageLabel").textContent = "MY PROFILE";
        document.getElementById("profilePageTitle").textContent = "Edit your profile.";
        document.getElementById("profilePageDescription").textContent =
            "Update the education and experience used to personalize your career path.";
        document.getElementById("profileBackButton").href = profileReturnPage;
        document.getElementById("profileBackButton").textContent = "Cancel";
        document.getElementById("profileSaveButton").innerHTML =
            "Save Changes <span>✓</span>";
    }
    const profileFields = [
        { key: "fullName", label: "nickname", input: fullNameInput },
        {
            key: "educationLevel",
            label: "education level",
            input: educationInputs[0],
            isEmpty: function () {
                return !educationInputs.some(function (input) { return input.checked; });
            }
        },
        { key: "major", label: "field of study", input: majorInput },
        { key: "semester", label: "current semester", input: semesterInput },
        { key: "graduationYear", label: "expected graduation year", input: graduationInput },
        {
            key: "experience",
            label: "experience",
            input: experienceInputs[0],
            isEmpty: function () {
                return !experienceInputs.some(function (input) { return input.checked; });
            }
        }
    ];

    function isProfileFieldEmpty(field) {
        return field.isEmpty ? field.isEmpty() : !field.input.value.trim();
    }

    function markProfileField(field, invalid) {
        const group = field.input.closest(".form-group");
        if (group) group.classList.toggle("field-invalid", invalid);

        let errorText = group?.querySelector(".field-error-text");
        if (invalid && group && !errorText) {
            errorText = document.createElement("p");
            errorText.className = "field-error-text";
            errorText.textContent = "This field is required.";
            group.appendChild(errorText);
        } else if (!invalid) {
            errorText?.remove();
        }

        if (field.key === "educationLevel" || field.key === "experience") {
            const groupedInputs = field.key === "educationLevel"
                ? educationInputs
                : experienceInputs;
            groupedInputs.forEach(function (input) {
                input.setAttribute("aria-invalid", String(invalid));
            });
        } else {
            field.input.setAttribute("aria-invalid", String(invalid));
        }
    }

    function showMissingProfileFields(fields) {
        profileFields.forEach(function (field) {
            markProfileField(field, fields.some(function (item) { return item.key === field.key; }));
        });

        if (formMessage) {
            formMessage.textContent = `Please complete the following: ${fields.map(function (field) { return field.label; }).join(", ")}.`;
            formMessage.className = "form-message show error";
        }

        if (fields[0]) {
            fields[0].input.closest(".form-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
            fields[0].input.focus({ preventScroll: true });
        }
    }

    profileFields.forEach(function (field) {
        const inputs = field.key === "educationLevel"
            ? educationInputs
            : field.key === "experience"
                ? experienceInputs
                : [field.input];
        inputs.forEach(function (input) {
            input.addEventListener(
                input.type === "radio" || input.type === "checkbox" ? "change" : "input",
                function () {
                if (!isProfileFieldEmpty(field)) markProfileField(field, false);
                }
            );
        });
    });

    experienceInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            if (!input.checked) return;

            if (input === noExperienceInput) {
                experienceInputs.forEach(function (otherInput) {
                    if (otherInput !== noExperienceInput) otherInput.checked = false;
                });
            } else if (noExperienceInput) {
                noExperienceInput.checked = false;
            }
        });
    });

    function fillProfile(profile) {
        if (!profile) {
            return;
        }

        fullNameInput.value = profile.fullName || "";
        majorInput.value = profile.major || "";
        semesterInput.value = profile.semester || "";
        graduationInput.value = profile.graduationYear || "";

        document
            .querySelectorAll('input[name="educationLevel"]')
            .forEach(function (input) {
                input.checked = input.value === profile.educationLevel;
            });

        document
            .querySelectorAll('input[name="experience"]')
            .forEach(function (input) {
                input.checked =
                    Array.isArray(profile.experience) &&
                    profile.experience.includes(input.value);
            });
    }

    async function loadAccountProfile() {
        const localProfile = getSavedData("pathlyProfile");
        fillProfile(localProfile);

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
            return;
        }

        const { data, error } = await supabase
            .from("profiles")
            .select(
                "full_name, education_level, major, semester, graduation_year, experiences"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (error || !data) {
            return;
        }

        const accountProfile = {
            fullName: data.full_name || "",
            educationLevel: data.education_level || "",
            major: data.major || "",
            semester: data.semester ? String(data.semester) : "",
            graduationYear: data.graduation_year
                ? String(data.graduation_year)
                : "",
            experience: Array.isArray(data.experiences)
                ? data.experiences
                : []
        };

        localStorage.setItem(
            "pathlyProfile",
            JSON.stringify(accountProfile)
        );
        fillProfile(accountProfile);
    }

    loadAccountProfile().then(function () {
        const requestedMissing = new URLSearchParams(window.location.search)
            .get("missing")
            ?.split(",") || [];
        const fields = profileFields.filter(function (field) {
            return requestedMissing.includes(field.key) && isProfileFieldEmpty(field);
        });

        if (fields.length) showMissingProfileFields(fields);
    });

    profileForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const missingFields = profileFields.filter(isProfileFieldEmpty);
        if (missingFields.length) {
            showMissingProfileFields(missingFields);
            return;
        }

        const educationInput = document.querySelector(
            'input[name="educationLevel"]:checked'
        );

        const experience = Array.from(
            document.querySelectorAll('input[name="experience"]:checked')
        ).map(function (input) {
            return input.value;
        });

        const profile = {
            fullName: fullNameInput.value.trim(),
            educationLevel: educationInput ? educationInput.value : "",
            major: majorInput.value.trim(),
            semester: semesterInput.value,
            graduationYear: graduationInput.value,
            experience: experience
        };

        profileSubmitButton.disabled = true;

        if (formMessage) {
            formMessage.textContent = "Saving your profile...";
            formMessage.className = "form-message show";
        }

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (!user) {
            window.location.replace("login.html?next=onboarding.html");
            return;
        }

        const { error } = await supabase.from("profiles").upsert(
            {
                id: user.id,
                full_name: profile.fullName,
                education_level: profile.educationLevel,
                major: profile.major,
                semester: Number(profile.semester),
                graduation_year: Number(profile.graduationYear),
                experiences: profile.experience
            },
            { onConflict: "id" }
        );

        if (error) {
            profileSubmitButton.disabled = false;

            if (formMessage) {
                formMessage.textContent =
                    "Your profile could not be saved. Check your connection and try again.";
                formMessage.className = "form-message show error";
            }

            return;
        }

        localStorage.setItem("pathlyProfile", JSON.stringify(profile));

        if (formMessage) {
            formMessage.textContent =
                isEditingProfile
                    ? "Profile changes saved."
                    : "Profile saved. Opening your career stage...";
            formMessage.className = "form-message show";
        }

        window.setTimeout(function () {
            window.location.href = isEditingProfile
                ? profileReturnPage
                : "career-stage.html";
        }, isEditingProfile ? 500 : 0);
    });
}

const careerStageForm = document.getElementById("careerStageForm");
const stageMessage = document.getElementById("stageMessage");
const stageGreeting = document.getElementById("stageGreeting");

if (careerStageForm) {
    const profile = getSavedData("pathlyProfile");
    const savedStage = localStorage.getItem("pathlyCareerStage");
    const stageSubmitButton = careerStageForm.querySelector(
        'button[type="submit"]'
    );
    const stageGrid = careerStageForm.querySelector(".stage-grid");
    const stageInputs = Array.from(
        careerStageForm.querySelectorAll('input[name="careerStage"]')
    );

    const stageUrl = new URL(window.location.href);
    if (stageUrl.searchParams.get("reset") === "success" && stageMessage) {
        stageMessage.textContent =
            "Your career journey has been reset. Choose a stage to start again.";
        stageMessage.className = "form-message show";
        stageUrl.searchParams.delete("reset");
        window.history.replaceState({}, "", stageUrl);
    }

    stageInputs.forEach(function (input) {
        input.addEventListener("change", function () {
            stageGrid?.classList.remove("field-invalid");
            stageInputs.forEach(function (item) {
                item.setAttribute("aria-invalid", "false");
            });
            if (stageMessage?.classList.contains("error")) {
                stageMessage.className = "form-message";
            }
        });
    });

    if (profile && profile.fullName && stageGreeting) {
        stageGreeting.textContent =
            `Where are you in your career journey, ${profile.fullName}?`;
    }

    if (savedStage) {
        const savedStageInput = document.querySelector(
            `input[name="careerStage"][value="${savedStage}"]`
        );

        if (savedStageInput) {
            savedStageInput.checked = true;
        }
    }

    careerStageForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const selectedStage = document.querySelector(
            'input[name="careerStage"]:checked'
        );

        if (!selectedStage) {
            stageGrid?.classList.add("field-invalid");
            stageInputs.forEach(function (input) {
                input.setAttribute("aria-invalid", "true");
            });
            if (stageMessage) {
                stageMessage.textContent =
                    "Please choose your current career stage.";
                stageMessage.className = "form-message show error";
            }

            stageGrid?.scrollIntoView({ behavior: "smooth", block: "center" });
            stageInputs[0]?.focus({ preventScroll: true });

            return;
        }

        const stage = selectedStage.value;

        stageSubmitButton.disabled = true;

        if (stageMessage) {
            stageMessage.textContent =
                "Saving your career stage...";

            stageMessage.className = "form-message show";
        }

        const { error } = await saveCareerJourney({
            career_stage: stage
        });

        if (error) {
            stageSubmitButton.disabled = false;

            if (stageMessage) {
                stageMessage.textContent =
                    "Your career stage could not be saved. Please try again.";
                stageMessage.className = "form-message show error";
            }

            return;
        }

        localStorage.setItem("pathlyCareerStage", stage);

        if (stageMessage) {
            stageMessage.textContent =
                "Career stage saved. Preparing your next step...";
            stageMessage.className = "form-message show";
        }

        window.location.href = `career.html?mode=${stage}`;
    });
}

const routeContent = {
    explore: {
        label: "EXPLORE MODE",
        title: "Let's find a career direction worth exploring.",
        description:
            "You do not need a final career choice yet. Pathly will help you explore digital career paths before choosing a focus.",
        nextTitle: "Next: Explore Careers",
        nextDescription:
            "Explore Pathly's five career paths and understand what each role involves."
    },

    validate: {
        label: "COMPARE MODE",
        title:
            "Let's compare the career paths you are considering.",
        description:
            "Pathly will help you compare career options and make a more structured decision.",
        nextTitle: "Next: Compare Careers",
        nextDescription:
            "Choose up to three careers and compare their focus and skill requirements."
    },

    prepare: {
        label: "PREPARE MODE",
        title: "Let's prepare for the career you have in mind.",
        description:
            "With a target in mind, Pathly will guide you through career selection and a skill gap assessment.",
        nextTitle: "Next: Choose Your Career Target",
        nextDescription:
            "Choose your career target before assessing your skills and evidence."
    }
};

const routeTitle = document.getElementById("routeTitle");
const routeDescription = document.getElementById("routeDescription");
const routePreview = document.getElementById("routePreview");
const routeLabel = document.getElementById("routeLabel");

if (routeTitle && routeDescription && routePreview) {
    const urlParams = new URLSearchParams(window.location.search);

    const mode =
        urlParams.get("mode") ||
        localStorage.getItem("pathlyCareerStage");

    const content = routeContent[mode];

    if (content) {
        if (routeLabel) {
            routeLabel.textContent = content.label;
        }

        routeTitle.textContent = content.title;
        routeDescription.textContent = content.description;

        routePreview.innerHTML = `
            <strong>${content.nextTitle}</strong>
            ${content.nextDescription}
        `;
    } else {
        if (routeLabel) {
            routeLabel.textContent = "TAHAP CAREER";
        }

        routeTitle.textContent =
            "Choose your career stage first.";

        routeDescription.textContent =
            "Pathly needs to understand where you are in your career journey before planning your next steps.";

        routePreview.innerHTML = `
            <strong>Career stage not found</strong>
            Go back and choose Explore, Compare, or Prepare.
        `;
    }
}
