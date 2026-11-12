# Pathly Career Data Methodology

**Mapping version:** 1.1  
**Last reviewed:** September 5, 2026  
**Scope:** Pathly's five initial careers

This document explains the skill sources, weights, and limitations. The Pathly team maps requirements manually; the application does not automatically generate career requirements using AI. The English interface retains the same weights and targets.

## Reference sources

1. **O\*NET OnLine** provides baseline occupation profiles with tasks, work activities, skills, and relevant technologies. It reflects the US labor market and is not sufficient on its own to infer Indonesian requirements.
2. **ESCO** is used to compare occupation and skill terminology. This European classification supports career guidance and skills-gap analysis.
3. **The Indonesian Ministry of Manpower's SKKNI portal** provides context for Indonesian competency standards. Pathly does not claim that every MVP skill corresponds to a specific SKKNI competency unit.
4. **Sample Indonesian Jobstreet listings** provide a limited local context check. Listings are dynamic; the observations below reflect the recorded review, not a guarantee that the same vacancies remain active.

General references:

- [O\*NET Database](https://www.onetcenter.org/database.html)
- [ESCO Services/API](https://esco.ec.europa.eu/en/use-esco/use-esco-services-api)
- [SKKNI portal](https://skkni.kemnaker.go.id/)

## Mapping by career

| Pathly career | Main occupation profile | Indonesian job sample | Recorded findings |
| --- | --- | --- | --- |
| Data Analyst | [O\*NET Business Intelligence Analysts, 15-2051.01](https://www.onetonline.org/link/summary/15-2051.01) | [Jobstreet Data Analyst](https://id.jobstreet.com/id/data-analyst-jobs) | Data analysis, reports/dashboards, SQL, Excel, Power BI/Tableau, insights, and business recommendations. |
| Business Analyst | [O\*NET Management Analysts, 13-1111.00](https://www.onetonline.org/link/summary/13-1111.00) | [Jobstreet Business Analyst](https://id.jobstreet.com/id/business-analyst-jobs) | Requirements elicitation, stakeholder engagement, solution design, testing/UAT, and alignment between business and technical needs. |
| Front-End Developer | [O\*NET Web Developers, 15-1254.00](https://www.onetonline.org/link/summary/15-1254.00) | [Jobstreet Front End Developer](https://id.jobstreet.com/id/front-end-developer-jobs) | UI implementation, React/Next.js, responsive web interfaces, testing, and API integration. |
| UI/UX Designer | [O\*NET Web and Digital Interface Designers, 15-1255.00](https://www.onetonline.org/link/summary/15-1255.00) | [Jobstreet UI/UX Designer](https://id.jobstreet.com/id/ui-ux-designer-jobs) | Discovery-to-delivery work, translating user needs, intuitive interfaces, and digital visual design. |
| Digital Marketing Specialist | [O\*NET Search Marketing Strategists, 13-1161.01](https://www.onetonline.org/link/summary/13-1161.01) | [Jobstreet Digital Marketing Specialist](https://id.jobstreet.com/id/digital-marketing-specialist-jobs) | Performance marketing, paid media, SEO, analytics, content, and campaign optimization. |

The existing project records a Jobstreet review on September 5, 2026. The team read summaries of several listings for each career and retained skills consistent with the baseline occupation profile. Employer names were not used to add weight. Translating this document does not represent a new review of those listings.

## Weights and targets

These are **Pathly learning-priority heuristics**, not graduation, certification, or hiring thresholds.

| Category | Weight | Pathly target | Curation rule |
| --- | ---: | --- | --- |
| Core | 3 | 2 — Applied | Directly connected to the role's main outputs and consistently present in the occupation profile and local sample. |
| Important | 2 | 1 — Learning | Supports tools, collaboration, or processes without being the same main output in every work context. |

Alignment uses only the user's level, target, and weight. Evidence categories and reference links **do not increase the score**.

## Limitations and review schedule

- The five profiles simplify variations in job titles, seniority, industries, and employers.
- O\*NET and ESCO are not Indonesian labor-market standards.
- Job samples are small snapshots and can change or expire.
- The mapping has not been reviewed by a practitioner in every field.
- The team should review it each semester, record the date, and compare at least three active listings per career before changing skills, weights, or targets.

Mapping changes should update this document, `js/requirements.js`, `lastReviewed` in `js/careers.js`, and the relevant tests.
