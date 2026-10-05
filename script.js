/* =========================================================
   WE ARE, WHAT WE EAT
   Wikipedia-Only JavaScript
   ========================================================= */


/* ================= GLOBAL DATA ================= */

let currentFood = null;
let quizIndex = 0;
let quizScore = 0;


/* ================= SCREEN SYSTEM ================= */

function showScreen(screenId) {

    const screens = document.querySelectorAll(".screen");

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    updateNavigation(screenId);
}


function updateNavigation(screenId) {

    const navButtons =
        document.querySelectorAll(".bottom-nav button");

    navButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    if (screenId === "homeScreen") {
        document.getElementById("navHome")?.classList.add("active");
    }

    if (screenId === "searchScreen") {
        document.getElementById("navSearch")?.classList.add("active");
    }

    if (screenId === "compareScreen") {
        document.getElementById("navCompare")?.classList.add("active");
    }

    if (screenId === "eatScreen") {
        document.getElementById("navEat")?.classList.add("active");
    }

    if (screenId === "quizScreen") {
        document.getElementById("navQuiz")?.classList.add("active");
    }
}


function goHome() {
    showScreen("homeScreen");
}


/* ================= SEARCH NAVIGATION ================= */

function focusSearch() {

    showScreen("searchScreen");

    setTimeout(() => {

        const input =
            document.getElementById("foodSearch");

        if (input) {
            input.focus();
        }

    }, 300);
}


function openSearch() {
    focusSearch();
}


/* =========================================================
   WIKIPEDIA SEARCH
   ========================================================= */

/*
   We do NOT maintain a food list.

   Wikipedia itself is used as the search engine.

   Example:
   "dragan frut"
        ↓
   Wikipedia search
        ↓
   "Dragon fruit"
        ↓
   Wikipedia page
*/


async function wikipediaSearch(query) {

    try {

        const url =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&list=search" +
            "&srsearch=" +
            encodeURIComponent(query) +
            "&srlimit=8" +
            "&format=json" +
            "&origin=*";


        const response =
            await fetch(url);


        if (!response.ok) {
            return [];
        }


        const data =
            await response.json();


        return data?.query?.search || [];

    } catch (error) {

        console.error(
            "Wikipedia search error:",
            error
        );

        return [];
    }
}


/* =========================================================
   GET WIKIPEDIA PAGE
   ========================================================= */

async function getWikipediaPage(title) {

    try {

        const url =
            "https://en.wikipedia.org/api/rest_v1/page/summary/" +
            encodeURIComponent(title);


        const response =
            await fetch(url);


        if (!response.ok) {
            return null;
        }


        const data =
            await response.json();


        return {

            title:
                data.title || title,

            description:
                data.extract || "",

            image:
                data.thumbnail?.source || "",

            url:
                data.content_urls?.desktop?.page ||
                `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,

            type:
                data.type || "",

            originalImage:
                data.originalimage?.source || ""

        };

    } catch (error) {

        console.error(
            "Wikipedia page error:",
            error
        );

        return null;
    }
}


/* =========================================================
   SMART WIKIPEDIA FOOD SEARCH
   ========================================================= */

async function searchWikipediaFood(query) {

    /*
       First try the exact query.
    */

    let results =
        await wikipediaSearch(query);


    if (!results.length) {
        return null;
    }


    /*
       Try the search results one by one.

       This makes the system more flexible than
       using a hardcoded food-name database.
    */

    for (const item of results) {

        const page =
            await getWikipediaPage(item.title);

        if (!page) {
            continue;
        }


        /*
           Wikipedia search result + summary
           is enough for our school project.
        */

        if (
            page.description ||
            page.image
        ) {

            return page;
        }
    }


    return null;
}


/* =========================================================
   BUILD FOOD DATA
   ========================================================= */

/*
   IMPORTANT:

   There is NO AI here.

   We never invent:
   - calories
   - protein
   - soil
   - origin
   - benefits
   - ingredients

   If Wikipedia does not provide the information,
   the website displays N/A.
*/


function buildFoodData(wikipedia) {

    const name =
        wikipedia?.title || "Unknown Food";


    const description =
        wikipedia?.description || "N/A";


    return {

        name: name,

        category: "Food information",

        description: description,

        origin: "See Wikipedia source",

        history: description,

        soil: "N/A",

        growing: "N/A",

        production: "N/A",

        making: "N/A",

        ingredients: [],

        regions: [],

        benefits: [],

        facts: [],

        processTitle: "Food Information",

        processSteps: [

            "Wikipedia provides the available public information about this food.",

            "For detailed cultivation, production or preparation information, open the Wikipedia source below."

        ],

        nutrition: {

            calories: "N/A",

            protein: "N/A",

            carbs: "N/A",

            fat: "N/A",

            fibre: "N/A",

            sugar: "N/A",

            salt: "N/A"

        }

    };
}


/* =========================================================
   MAIN SEARCH
   ========================================================= */

async function searchFood() {

    const input =
        document.getElementById("foodSearch");

    const result =
        document.getElementById("searchResult");

    const loading =
        document.getElementById("searchLoading");

    const button =
        document.getElementById("searchButton");


    if (!input || !result || !loading) {
        return;
    }


    const query =
        input.value.trim();


    if (!query) {

        showToast(
            "Please enter something to search."
        );

        input.focus();

        return;
    }


    showScreen("searchScreen");


    result.innerHTML = "";

    loading.classList.remove("hidden");


    if (button) {
        button.disabled = true;
    }


    try {

        const loadingText =
            document.getElementById("loadingText");


        if (loadingText) {

            loadingText.textContent =
                "Searching Wikipedia...";
        }


        /*
           Search Wikipedia.
        */

        const wikipedia =
            await searchWikipediaFood(query);


        /*
           No result.
        */

        if (!wikipedia) {

            result.innerHTML = `

                <div class="not-found">

                    <div class="not-found-icon">
                        🔎
                    </div>

                    <h3>
                        Information not found
                    </h3>

                    <p>
                        Wikipedia could not find reliable
                        information for
                        "<strong>${escapeHTML(query)}</strong>".
                    </p>

                    <p>
                        Try another spelling or search for
                        a food, fruit, vegetable, ingredient,
                        grain, beverage or dish.
                    </p>

                    <button
                        class="secondary-btn"
                        onclick="focusSearch()"
                    >
                        Try Another Search
                    </button>

                </div>

            `;

            return;
        }


        if (loadingText) {

            loadingText.textContent =
                "Building food profile...";
        }


        /*
           Build profile only from Wikipedia data.
        */

        const info =
            buildFoodData(wikipedia);


        currentFood = {

            ...info,

            searchName: query,

            wikipedia: wikipedia,

            wikimedia: [],

            nutritionProducts: []

        };


        renderFood(currentFood);


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        result.innerHTML = `

            <div class="error-box">

                <div class="not-found-icon">
                    ⚠️
                </div>

                <h3>
                    Something went wrong
                </h3>

                <p>
                    ${escapeHTML(
                        error?.message ||
                        "Wikipedia could not be reached."
                    )}
                </p>

                <p>
                    Please check your internet connection
                    and try again.
                </p>

            </div>

        `;

    } finally {

        loading.classList.add("hidden");


        if (button) {
            button.disabled = false;
        }

    }
}


/* =========================================================
   RENDER FOOD
   ========================================================= */

function renderFood(food) {

    const result =
        document.getElementById("searchResult");


    if (!result) {
        return;
    }


    const image =
        food.wikipedia?.image ||
        food.wikipedia?.originalImage ||
        "";


    const sourceLinks = [];


    if (food.wikipedia?.url) {

        sourceLinks.push(`

            <a
                href="${food.wikipedia.url}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Wikipedia
            </a>

        `);

    }


    const nutrition =
        food.nutrition || {};


    result.innerHTML = `

        <article class="food-profile">


            <!-- HERO -->

            <section class="food-hero">

                <div class="food-image-wrap">

                    ${
                        image
                        ?
                        `

                        <img
                            src="${image}"
                            alt="${escapeHTML(food.name)}"
                            class="food-image"
                            loading="lazy"
                        >

                        `
                        :
                        `

                        <div class="image-placeholder">
                            🍽️
                        </div>

                        `
                    }

                </div>


                <div class="food-main-info">

                    <span class="category-tag">
                        ${escapeHTML(
                            food.category ||
                            "Food information"
                        )}
                    </span>


                    <h2>
                        ${escapeHTML(
                            food.name ||
                            food.searchName
                        )}
                    </h2>


                    <p>
                        ${escapeHTML(
                            food.description ||
                            "N/A"
                        )}
                    </p>


                    <div class="hero-actions">

                        <button
                            class="secondary-btn"
                            onclick="addFoodToCompare()"
                        >
                            ⚖️ Add to Compare
                        </button>


                        <button
                            class="secondary-btn"
                            onclick="openFoodQuiz()"
                        >
                            🧠 Quiz
                        </button>

                    </div>

                </div>

            </section>


            <!-- NUTRITION -->

            <section class="data-section">

                <div class="section-title">

                    <span>01</span>

                    <div>

                        <h3>
                            Nutrition Lab
                        </h3>

                        <p>
                            Wikipedia-only mode
                        </p>

                    </div>

                </div>


                <div class="nutrition-grid">

                    ${nutritionItem(
                        "🔥",
                        "Calories",
                        nutrition.calories
                    )}

                    ${nutritionItem(
                        "💪",
                        "Protein",
                        nutrition.protein
                    )}

                    ${nutritionItem(
                        "🌾",
                        "Carbohydrates",
                        nutrition.carbs
                    )}

                    ${nutritionItem(
                        "🥑",
                        "Fat",
                        nutrition.fat
                    )}

                    ${nutritionItem(
                        "🌿",
                        "Fibre",
                        nutrition.fibre
                    )}

                    ${nutritionItem(
                        "🍬",
                        "Sugar",
                        nutrition.sugar
                    )}

                    ${nutritionItem(
                        "🧂",
                        "Salt",
                        nutrition.salt
                    )}

                </div>


                <p class="comparison-note">

                    Detailed nutrition values are not
                    estimated or invented when they are
                    unavailable in the connected source.

                </p>

            </section>


            <!-- ORIGIN -->

            <section class="two-column">

                <div class="content-card">

                    <span class="card-label">
                        🌍 ORIGIN
                    </span>

                    <h3>
                        Where did it come from?
                    </h3>

                    <p>
                        ${escapeHTML(
                            food.origin || "N/A"
                        )}
                    </p>

                </div>


                <div class="content-card">

                    <span class="card-label">
                        📜 HISTORY
                    </span>

                    <h3>
                        Historical information
                    </h3>

                    <p>
                        ${escapeHTML(
                            food.history || "N/A"
                        )}
                    </p>

                </div>

            </section>


            <!-- GROWING / PRODUCTION -->

            <section class="two-column">

                <div class="content-card">

                    <span class="card-label">
                        🌱 HOW IT GROWS
                    </span>

                    <h3>
                        Growing Information
                    </h3>

                    <p>
                        ${escapeHTML(
                            food.growing || "N/A"
                        )}
                    </p>

                </div>


                <div class="content-card">

                    <span class="card-label">
                        🏭 PRODUCTION
                    </span>

                    <h3>
                        How it is produced
                    </h3>

                    <p>
                        ${escapeHTML(
                            food.production || "N/A"
                        )}
                    </p>

                </div>

            </section>


            <!-- SOIL -->

            <section class="soil-card">

                <div class="soil-icon">
                    🌱
                </div>

                <div>

                    <span class="card-label">
                        SOIL & GROWING CONDITIONS
                    </span>

                    <h3>
                        What kind of soil does it need?
                    </h3>

                    <p>
                        ${escapeHTML(
                            food.soil || "N/A"
                        )}
                    </p>

                </div>

            </section>


            <!-- INGREDIENTS -->

            <section class="content-card full">

                <span class="card-label">
                    🧪 WHAT'S INSIDE?
                </span>

                <h3>
                    Ingredients / Main Components
                </h3>

                <div class="pill-list">

                    ${renderArray(
                        food.ingredients,
                        "N/A"
                    )}

                </div>

            </section>


            <!-- MAKING -->

            <section class="content-card full">

                <span class="card-label">
                    👨‍🍳 MAKING / PREPARATION
                </span>

                <h3>
                    How is it made?
                </h3>

                <p>
                    ${escapeHTML(
                        food.making || "N/A"
                    )}
                </p>

            </section>


            <!-- PROCESS -->

            <section class="process-section">

                <div class="section-title">

                    <span>02</span>

                    <div>

                        <h3>
                            ${escapeHTML(
                                food.processTitle ||
                                "Food Information"
                            )}
                        </h3>

                        <p>
                            Available source information
                        </p>

                    </div>

                </div>


                <div class="process-list">

                    ${renderProcessSteps(
                        food.processSteps
                    )}

                </div>


                <button
                    class="video-prompt-btn"
                    onclick="showVideoPrompt()"
                >
                    ▶️ Process Video Concept
                </button>

            </section>


            <!-- INDIA -->

            <section class="content-card full">

                <span class="card-label">
                    🇮🇳 INDIA
                </span>

                <h3>
                    Where is it found, grown or commonly associated?
                </h3>

                <div class="pill-list">

                    ${renderArray(
                        food.regions,
                        "N/A"
                    )}

                </div>

            </section>


            <!-- BENEFITS -->

            <section class="two-column">

                <div class="content-card">

                    <span class="card-label">
                        💚 BENEFITS
                    </span>

                    <h3>
                        What does it provide?
                    </h3>

                    <ul class="clean-list">

                        ${renderList(
                            food.benefits
                        )}

                    </ul>

                </div>


                <div class="content-card">

                    <span class="card-label">
                        💡 DID YOU KNOW?
                    </span>

                    <h3>
                        Interesting Facts
                    </h3>

                    <ul class="clean-list">

                        ${renderList(
                            food.facts
                        )}

                    </ul>

                </div>

            </section>


            <!-- INLINE CALCULATOR -->

            <section class="inline-calculator">

                <div>

                    <span class="card-label">
                        🍽️ Aaj Aapne Kya Khaya?
                    </span>

                    <h3>
                        Estimate calories for this food
                    </h3>

                    <p>
                        Wikipedia-only mode does not
                        estimate nutrition values.
                    </p>

                </div>


                <div class="inline-calculator-controls">

                    <input
                        id="inlineQuantity"
                        type="number"
                        min="1"
                        placeholder="grams"
                    >


                    <button
                        onclick="calculateInlineCalories()"
                    >
                        Calculate
                    </button>

                </div>


                <div
                    id="inlineCalorieResult"
                    class="inline-result"
                ></div>

            </section>


            <!-- SOURCE -->

            <section class="sources-section">

                <span class="card-label">
                    🔗 SOURCE
                </span>

                <h3>
                    Public source used
                </h3>

                <div class="source-links">

                    ${
                        sourceLinks.length
                        ?
                        sourceLinks.join("")
                        :
                        `<span>N/A</span>`
                    }

                </div>

            </section>


        </article>

    `;
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function nutritionItem(
    icon,
    label,
    value
) {

    let displayValue =
        value === undefined ||
        value === null ||
        value === ""
            ? "N/A"
            : value;


    return `

        <div class="nutrition-item">

            <div class="nutrition-icon">
                ${icon}
            </div>

            <div>

                <span>
                    ${escapeHTML(label)}
                </span>

                <strong>
                    ${escapeHTML(
                        String(displayValue)
                    )}
                </strong>

            </div>

        </div>

    `;
}


function renderArray(
    array,
    emptyText
) {

    if (
        !Array.isArray(array) ||
        array.length === 0
    ) {

        return `

            <span class="empty-pill">
                ${escapeHTML(emptyText)}
            </span>

        `;

    }


    return array
        .slice(0, 15)
        .map(item => `

            <span class="pill">
                ${escapeHTML(
                    String(item)
                )}
            </span>

        `)
        .join("");
}


function renderList(array) {

    if (
        !Array.isArray(array) ||
        array.length === 0
    ) {

        return `<li>N/A</li>`;

    }


    return array
        .slice(0, 8)
        .map(item => `

            <li>
                ${escapeHTML(
                    String(item)
                )}
            </li>

        `)
        .join("");
}


function renderProcessSteps(
    steps
) {

    if (
        !Array.isArray(steps) ||
        steps.length === 0
    ) {

        return `

            <div class="process-empty">
                Process information: N/A
            </div>

        `;

    }


    return steps
        .slice(0, 10)
        .map((step, index) => `

            <div class="process-step">

                <div class="step-number">
                    ${String(
                        index + 1
                    ).padStart(2, "0")}
                </div>

                <div>

                    <h4>
                        Step ${index + 1}
                    </h4>

                    <p>
                        ${escapeHTML(
                            String(step)
                        )}
                    </p>

                </div>

            </div>

        `)
        .join("");
}


/* =========================================================
   COMPARE
   ========================================================= */

/*
   Since the project is now Wikipedia-only,
   comparison cannot fabricate nutrition values.

   It compares the two Wikipedia pages and shows
   their available descriptions.
*/


async function compareFoods() {

    const food1 =
        document.getElementById(
            "compareFood1"
        )?.value.trim();


    const food2 =
        document.getElementById(
            "compareFood2"
        )?.value.trim();


    const result =
        document.getElementById(
            "compareResult"
        );


    const loading =
        document.getElementById(
            "compareLoading"
        );


    if (!food1 || !food2) {

        showToast(
            "Enter both foods first."
        );

        return;
    }


    if (loading) {
        loading.classList.remove("hidden");
    }


    if (result) {
        result.innerHTML = "";
    }


    try {

        const [a, b] =
            await Promise.all([

                searchWikipediaFood(food1),

                searchWikipediaFood(food2)

            ]);


        if (!a || !b) {

            result.innerHTML = `

                <div class="not-found">

                    <h3>
                        Comparison unavailable
                    </h3>

                    <p>
                        Wikipedia information could not
                        be found for both searches.
                    </p>

                </div>

            `;

            return;
        }


        result.innerHTML = `

            <section class="comparison-card">

                <div class="comparison-header">

                    <span class="badge">
                        WIKIPEDIA COMPARISON
                    </span>


                    <h3>

                        ${escapeHTML(a.title)}

                        <span>
                            VS
                        </span>

                        ${escapeHTML(b.title)}

                    </h3>

                </div>


                <div class="comparison-table">

                    ${comparisonRow(
                        "Information",
                        "Available",
                        "Available"
                    )}


                    ${comparisonRow(
                        "Image",
                        a.image ? "Available" : "N/A",
                        b.image ? "Available" : "N/A"
                    )}


                    ${comparisonRow(
                        "Description",
                        a.description
                            ? "Available"
                            : "N/A",
                        b.description
                            ? "Available"
                            : "N/A"
                    )}

                </div>


                <div class="two-column">

                    <div class="content-card">

                        <span class="card-label">
                            ${escapeHTML(a.title)}
                        </span>

                        <p>
                            ${escapeHTML(
                                a.description ||
                                "N/A"
                            )}
                        </p>

                        <a
                            href="${a.url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Wikipedia →
                        </a>

                    </div>


                    <div class="content-card">

                        <span class="card-label">
                            ${escapeHTML(b.title)}
                        </span>

                        <p>
                            ${escapeHTML(
                                b.description ||
                                "N/A"
                            )}
                        </p>

                        <a
                            href="${b.url}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Open Wikipedia →
                        </a>

                    </div>

                </div>


                <p class="comparison-note">

                    This comparison uses Wikipedia only.
                    No nutrition values or scientific
                    numbers are generated.

                </p>

            </section>

        `;

    } catch (error) {

        console.error(
            "Comparison error:",
            error
        );


        result.innerHTML = `

            <div class="error-box">

                <h3>
                    Comparison unavailable
                </h3>

                <p>
                    ${escapeHTML(
                        error?.message ||
                        "Wikipedia search failed."
                    )}
                </p>

            </div>

        `;

    } finally {

        if (loading) {
            loading.classList.add("hidden");
        }

    }
}


function comparisonRow(
    label,
    value1,
    value2
) {

    return `

        <div class="comparison-row">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(
                    String(value1)
                )}
            </strong>

            <strong>
                ${escapeHTML(
                    String(value2)
                )}
            </strong>

        </div>

    `;
}


/* =========================================================
   ADD TO COMPARE
   ========================================================= */

function addFoodToCompare() {

    if (!currentFood) {

        showToast(
            "Search for a food first."
        );

        return;
    }


    showScreen(
        "compareScreen"
    );


    const first =
        document.getElementById(
            "compareFood1"
        );


    const second =
        document.getElementById(
            "compareFood2"
        );


    if (
        first &&
        !first.value.trim()
    ) {

        first.value =
            currentFood.name ||
            currentFood.searchName;

    } else if (
        second &&
        !second.value.trim()
    ) {

        second.value =
            currentFood.name ||
            currentFood.searchName;

    } else {

        showToast(
            "Both comparison boxes are already filled."
        );

    }

}


/* =========================================================
   CALORIE CALCULATOR
   ========================================================= */

/*
   Wikipedia does not provide a consistent nutrition
   database.

   Therefore we DO NOT calculate fake calories.

   The calculator safely explains that calorie data
   isn't available in Wikipedia-only mode.
*/


async function calculateCalories() {

    const food =
        document.getElementById(
            "eatFood"
        )?.value.trim();


    const quantity =
        Number(
            document.getElementById(
                "eatQuantity"
            )?.value
        );


    const result =
        document.getElementById(
            "calorieResult"
        );


    if (
        !food ||
        !quantity ||
        quantity <= 0
    ) {

        showToast(
            "Enter food and quantity."
        );

        return;
    }


    result.innerHTML = `

        <div class="calorie-result-card">

            <span>
                WIKIPEDIA-ONLY MODE
            </span>

            <strong>
                N/A
            </strong>

            <p>
                Reliable calorie information for
                ${escapeHTML(food)}
                is not available through the
                connected Wikipedia source.
            </p>

        </div>

    `;
}


async function calculateInlineCalories() {

    const quantity =
        Number(
            document.getElementById(
                "inlineQuantity"
            )?.value
        );


    const result =
        document.getElementById(
            "inlineCalorieResult"
        );


    if (
        !currentFood ||
        !quantity ||
        quantity <= 0
    ) {

        result.textContent =
            "Enter a valid quantity.";

        return;
    }


    result.innerHTML = `

        <strong>
            N/A
        </strong>

        <span>
            Calorie data is not available
            from Wikipedia-only mode.
        </span>

    `;
}


function calculateFoodCalories() {
    calculateCalories();
}


/* =========================================================
   QUIZ
   ========================================================= */

const quizQuestions = [

    {
        question:
            "Which nutrient is mainly responsible for building and repairing body tissues?",

        options: [
            "Protein",
            "Sugar",
            "Water",
            "Salt"
        ],

        answer: 0
    },


    {
        question:
            "Which part of a plant usually absorbs water and minerals from soil?",

        options: [
            "Flower",
            "Root",
            "Fruit",
            "Seed"
        ],

        answer: 1
    },


    {
        question:
            "Which nutrient provides the body's main source of energy?",

        options: [
            "Carbohydrates",
            "Vitamins",
            "Minerals",
            "Fibre"
        ],

        answer: 0
    },


    {
        question:
            "Which of these is a dairy product?",

        options: [
            "Paneer",
            "Rice",
            "Potato",
            "Apple"
        ],

        answer: 0
    },


    {
        question:
            "What is the process of growing and collecting crops called?",

        options: [
            "Agriculture",
            "Digestion",
            "Respiration",
            "Fermentation"
        ],

        answer: 0
    }

];


function startQuiz() {

    showScreen(
        "quizScreen"
    );


    quizIndex = 0;

    quizScore = 0;

    renderQuizQuestion();
}


function renderQuizQuestion() {

    const box =
        document.getElementById(
            "quizBox"
        );


    if (!box) {
        return;
    }


    if (
        quizIndex >=
        quizQuestions.length
    ) {

        showQuizResult();

        return;
    }


    const q =
        quizQuestions[quizIndex];


    const progress =
        (
            quizIndex /
            quizQuestions.length
        ) *
        100;


    box.innerHTML = `

        <div class="quiz-top">

            <span>

                Question
                ${quizIndex + 1}
                /
                ${quizQuestions.length}

            </span>


            <div class="quiz-progress">

                <div
                    style="width:${progress}%"
                ></div>

            </div>

        </div>


        <h3 class="quiz-question">

            ${escapeHTML(
                q.question
            )}

        </h3>


        <div class="quiz-options">

            ${
                q.options
                    .map(
                        (option, index) => `

                            <button
                                onclick="checkQuizAnswer(${index})"
                            >

                                <span>
                                    ${String.fromCharCode(
                                        65 + index
                                    )}
                                </span>

                                ${escapeHTML(
                                    option
                                )}

                            </button>

                        `
                    )
                    .join("")
            }

        </div>

    `;
}


function checkQuizAnswer(
    selected
) {

    const question =
        quizQuestions[quizIndex];


    const buttons =
        document.querySelectorAll(
            ".quiz-options button"
        );


    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );


    if (
        selected ===
        question.answer
    ) {

        quizScore++;


        buttons[selected]
            ?.classList.add(
                "correct"
            );

    } else {

        buttons[selected]
            ?.classList.add(
                "wrong"
            );


        buttons[question.answer]
            ?.classList.add(
                "correct"
            );
    }


    setTimeout(() => {

        quizIndex++;

        renderQuizQuestion();

    }, 900);
}


function showQuizResult() {

    const box =
        document.getElementById(
            "quizBox"
        );


    const percentage =
        Math.round(
            quizScore /
            quizQuestions.length *
            100
        );


    box.innerHTML = `

        <div class="quiz-result">

            <div class="quiz-big-icon">
                🏆
            </div>


            <h3>
                Quiz Complete!
            </h3>


            <strong>
                ${quizScore}
                /
                ${quizQuestions.length}
            </strong>


            <p>
                Score: ${percentage}%
            </p>


            <button
                class="primary-btn"
                onclick="showThankYou()"
            >
                Continue
            </button>

        </div>

    `;
}


function openQuiz() {
    startQuiz();
}


function openFoodQuiz() {
    startQuiz();
}


/* =========================================================
   VIDEO CONCEPT
   ========================================================= */

function showVideoPrompt() {

    showToast(
        "Process-video concept is ready for this food."
    );

}


/* =========================================================
   THANK YOU
   ========================================================= */

function showThankYou() {

    showScreen(
        "thankScreen"
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 2500);
}


/* =========================================================
   SECURITY
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   ENTER KEY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "WE ARE, WHAT WE EAT — Wikipedia-only JavaScript loaded successfully."
        );


        const searchInput =
            document.getElementById(
                "foodSearch"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        searchFood();

                    }

                }
            );

        }


        showScreen(
            "homeScreen"
        );

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showScreen =
    showScreen;

window.goHome =
    goHome;

window.openSearch =
    openSearch;

window.focusSearch =
    focusSearch;

window.searchFood =
    searchFood;

window.compareFoods =
    compareFoods;

window.addFoodToCompare =
    addFoodToCompare;

window.calculateCalories =
    calculateCalories;

window.calculateFoodCalories =
    calculateFoodCalories;

window.calculateInlineCalories =
    calculateInlineCalories;

window.startQuiz =
    startQuiz;

window.openQuiz =
    openQuiz;

window.openFoodQuiz =
    openFoodQuiz;

window.checkQuizAnswer =
    checkQuizAnswer;

window.showThankYou =
    showThankYou;

window.showVideoPrompt =
    showVideoPrompt;