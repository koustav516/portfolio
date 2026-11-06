(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var rand = function (a, b) { return Math.round(a + Math.random() * (b - a)); };

    /* ---------------- theme ---------------- */
    $("#themeToggle").addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("km-theme", next); } catch (e) {}
    });

    /* ---------------- top bar ---------------- */
    var topbar = $(".topbar");
    var onScroll = function () { topbar.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var menuBtn = $("#menuBtn"), mobileNav = $("#mobileNav");
    menuBtn.addEventListener("click", function () {
        var open = mobileNav.classList.toggle("open");
        menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$("a", mobileNav).forEach(function (a) {
        a.addEventListener("click", function () {
            mobileNav.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        });
    });

    /* ---------------- "request" on navigation ---------------- */
    var reqLine = $("#reqLine"), reqToast = $("#reqToast"), toastTimer;
    function fireRequest(method, path, status) {
        var ms = rand(18, 64);
        if (!reduceMotion) {
            reqLine.classList.remove("run");
            void reqLine.offsetWidth;
            reqLine.classList.add("run");
        }
        reqToast.innerHTML = method + " " + path + ' <span class="t-ok">' + (status || "200 OK") + '</span> <span class="t-ms">· ' + ms + "ms</span>";
        reqToast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { reqToast.classList.remove("show"); }, 1800);
    }
    $$('a[href^="#"]').forEach(function (a) {
        var id = a.getAttribute("href").slice(1);
        if (!id || id === "main") return;
        a.addEventListener("click", function () {
            var isPost = id === "contact";
            fireRequest(isPost ? "POST" : "GET", "/" + (id === "home" ? "" : id), isPost ? "201 Created" : "200 OK");
        });
    });

    // Active endpoint highlighting
    var navLinks = $$(".endpoints a");
    var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
    if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    navLinks.forEach(function (a) {
                        a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id);
                    });
                }
            });
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach(function (s) { spy.observe(s); });
    }

    /* ---------------- API console ---------------- */
    var routes = {
        profile: {
            name: "Koustav Majumder",
            role: "Software Engineer",
            location: "Chicago, IL",
            open_to_relocate: true,
            experience_years: 2.5,
            current: "Backend Developer @ Community Dreams Foundation",
            focus: ["Java", "Spring Boot", "Microservices", "REST APIs", "Async workflows"],
            domains: ["Financial services", "Research platforms", "Marketplaces"]
        },
        metrics: {
            monthly_api_requests: "1M+",
            api_latency_reduction_pct: 40,
            query_time_reduction_pct: 40,
            test_coverage_pct: 85,
            regression_defects_down_pct: 40,
            release_time_reduction_pct: 45,
            platform_uptime_pct: 99.9,
            zero_downtime_envs: 5
        },
        stack: {
            languages: ["Java 8+", "SQL", "PL/SQL", "JavaScript"],
            frameworks: ["Spring Boot", "Spring Data JPA", "Hibernate"],
            data: ["Oracle", "PostgreSQL", "MySQL", "Kafka"],
            testing: ["JUnit", "Mockito", "WireMock"],
            delivery: ["Jenkins", "Docker", "PCF", "OpenShift", "AWS", "Maven", "Gradle"]
        },
        status: {
            status: "AVAILABLE",
            seeking: ["Backend Engineer", "Java Developer", "Software Engineer"],
            based_in: "Chicago, IL",
            relocation: true,
            avg_reply_time: "< 24h",
            contact: "koustav516@gmail.com"
        }
    };

    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
    function highlight(json) {
        return esc(json).replace(
            /("(?:\\.|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?|[{}\[\],]/g,
            function (m, str, colon, lit) {
                if (str) return colon
                    ? '<span class="j-key">' + str + '</span><span class="j-p">' + colon + "</span>"
                    : '<span class="j-str">' + str + "</span>";
                if (lit) return '<span class="j-bool">' + m + "</span>";
                if (/^-?\d/.test(m)) return '<span class="j-num">' + m + "</span>";
                return '<span class="j-p">' + m + "</span>";
            }
        );
    }

    var tabs = $$(".ctab"), reqPath = $("#reqPath"), sendBtn = $("#sendBtn");
    var resMeta = $("#resMeta"), resBody = $("#resBody"), reqCount = $("#reqCount");
    var current = "profile", count = 0, inflight = null;

    function selectRoute(route, focus) {
        current = route;
        tabs.forEach(function (t) {
            var on = t.dataset.route === route;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            if (on && focus) t.focus();
        });
        reqPath.textContent = "/api/v1/koustav/" + route;
    }

    function send() {
        if (inflight) clearTimeout(inflight);
        var route = current;
        var latency = reduceMotion ? 0 : rand(90, 320);
        sendBtn.disabled = true;
        resMeta.innerHTML = '<span class="status-pill pending"><span class="spinner" aria-hidden="true"></span>pending</span>';
        resBody.innerHTML = "";
        inflight = setTimeout(function () {
            var body = JSON.stringify(routes[route], null, 2);
            var bytes = new Blob([body]).size;
            resMeta.innerHTML =
                '<span class="status-pill">200 OK</span><span>' + latency + " ms</span><span>" + bytes + " B</span><span>application/json</span>";
            var lines = highlight(body).split("\n");
            resBody.innerHTML = lines.map(function (l, i) {
                return '<span class="ln" style="animation-delay:' + (reduceMotion ? 0 : i * 22) + 'ms">' + (l || " ") + "</span>";
            }).join("");
            count++;
            reqCount.textContent = count + (count === 1 ? " request" : " requests");
            sendBtn.disabled = false;
            inflight = null;
        }, latency);
    }

    tabs.forEach(function (t, i) {
        t.addEventListener("click", function () { selectRoute(t.dataset.route); send(); });
        t.addEventListener("keydown", function (e) {
            var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!dir) return;
            e.preventDefault();
            var n = tabs[(i + dir + tabs.length) % tabs.length];
            selectRoute(n.dataset.route, true);
            send();
        });
    });
    sendBtn.addEventListener("click", send);
    selectRoute("profile");
    setTimeout(send, reduceMotion ? 0 : 600);

    /* ---------------- metric counters ---------------- */
    function countUp(el) {
        var target = parseFloat(el.dataset.count);
        var dec = parseInt(el.dataset.decimals || "0", 10);
        if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
        var start = performance.now(), dur = 1400;
        (function tick(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 4);
            el.textContent = (target * eased).toFixed(dec);
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }

    /* ---------------- reveal on scroll ---------------- */
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                if (el.dataset.count) countUp(el); else el.classList.add("in");
                io.unobserve(el);
            });
        }, { threshold: 0.15 });
        $$(".reveal, [data-count]").forEach(function (el) { io.observe(el); });
    } else {
        $$(".reveal").forEach(function (el) { el.classList.add("in"); });
        $$("[data-count]").forEach(function (el) { el.textContent = el.dataset.count; });
    }

    /* ---------------- experience tabs ---------------- */
    var expTabs = $$(".exp-tab");
    function selectExp(tab, focus) {
        expTabs.forEach(function (t) {
            var on = t === tab;
            t.setAttribute("aria-selected", String(on));
            t.tabIndex = on ? 0 : -1;
            var panel = document.getElementById(t.getAttribute("aria-controls"));
            panel.hidden = !on;
        });
        if (focus) tab.focus();
    }
    expTabs.forEach(function (t, i) {
        t.addEventListener("click", function () { selectExp(t); });
        t.addEventListener("keydown", function (e) {
            var k = e.key, dir = 0;
            if (k === "ArrowDown" || k === "ArrowRight") dir = 1;
            if (k === "ArrowUp" || k === "ArrowLeft") dir = -1;
            if (!dir) return;
            e.preventDefault();
            selectExp(expTabs[(i + dir + expTabs.length) % expTabs.length], true);
        });
    });

    /* ---------------- architecture inspector ---------------- */
    var CDF = "Community Dreams Foundation", CAP = "Capgemini · Discover Financial", ANX = "Annexbyte IT Solutions",
        MBB = "MyBrandbae", EML = "AI Email Writer", BCR = "Bcare Institute", CMP = "Campground Portal";
    var stack = {
        "REST APIs": ["Designing JSON REST contracts for transactional and banking workflows.", [CDF, CAP, ANX, MBB, EML]],
        "JSON": ["Request/response modelling and payload validation.", [CDF, CAP, EML, MBB]],
        "Service-to-service": ["Synchronous and async communication between microservices.", [CDF, CAP]],
        "JavaScript": ["Frontends, Chrome extensions and Node.js services.", [MBB, EML, BCR, CMP]],
        "Java": ["My primary language: Java 8+ features, OOP and concurrency.", [CDF, CAP, ANX, EML]],
        "Spring Boot": ["Production microservices for banking and research platforms.", [CDF, CAP, ANX, EML]],
        "Spring Framework": ["Dependency injection, Spring MVC and configuration.", [CDF, CAP, ANX]],
        "Microservices": ["Security, compliance and high-availability service design.", [CDF, CAP]],
        "Async processing": ["Moving slow work off the request path cut latency by 40%.", [CAP, CDF]],
        "Design Patterns": ["SOLID, layered architecture and common GoF patterns.", [CDF, CAP, ANX]],
        "Spring Data JPA": ["Repository design and tuned queries that remove N+1 patterns.", [CDF, ANX]],
        "Hibernate": ["ORM mapping, fetch strategies and connection pooling.", [CDF, CAP]],
        "Oracle": ["Indexing and query tuning on transactional schemas.", [CDF, CAP]],
        "PostgreSQL": ["Relational modelling for research and marketplace data.", [CDF, MBB]],
        "MySQL": ["Stored procedures and index work that took page loads from ~6s to under 2s.", [ANX]],
        "SQL": ["Hand-written SQL and PL/SQL for performance-critical paths.", [CDF, CAP, ANX]],
        "Kafka": ["Event-driven messaging concepts for asynchronous workflows.", [CAP]],
        "JUnit": ["Unit and integration suites behind 85% coverage.", [CDF, CAP, ANX]],
        "Mockito": ["Isolating legacy service classes for testing.", [ANX, CAP]],
        "WireMock": ["Stubbing downstream APIs for reliable integration tests.", [CDF, CAP]],
        "Jest": ["87 unit and integration tests across 5 suites.", [MBB]],
        "Git": ["Branching strategies, code review and release tagging.", [CDF, CAP, ANX, MBB, EML]],
        "Maven": ["Build lifecycle and dependency management.", [CDF, CAP, ANX]],
        "Jenkins": ["Pipelines that cut release time by 45% with zero downtime.", [CDF, CAP]],
        "Docker": ["Containerised Spring services, cutting provisioning from days to hours.", [ANX]],
        "PCF": ["Blue/green, zero-downtime deployments.", [CDF, CAP]],
        "OpenShift": ["Deployment configs across multiple environments.", [CAP, ANX]],
        "AWS": ["Cloud hosting and deployment fundamentals.", [MBB]]
    };
    var nodes = $$(".node"), inspName = $("#inspName"), inspNote = $("#inspNote"), inspUsed = $("#inspUsed");
    function inspect(node) {
        var key = node.dataset.node, data = stack[key];
        if (!data) return;
        nodes.forEach(function (n) {
            n.classList.toggle("is-on", n === node);
            n.setAttribute("aria-pressed", String(n === node));
            // related = used together in at least two of the same places
            var other = stack[n.dataset.node];
            n.classList.toggle("is-related", n !== node && !!other && overlap(other[1], data[1]) >= 2);
        });
        inspName.textContent = node.textContent;
        inspNote.textContent = data[0];
        inspUsed.innerHTML = data[1].map(function (c, i) {
            return '<li style="animation-delay:' + i * 50 + 'ms">' + esc(c) + "</li>";
        }).join("");
    }
    function overlap(a, b) { return a.filter(function (x) { return b.indexOf(x) > -1; }).length; }
    nodes.forEach(function (n) { n.addEventListener("click", function () { inspect(n); }); });
    var nodeCount = $("#nodeCount");
    if (nodeCount) nodeCount.textContent = nodes.length;
    var defaultNode = $('.node[data-node="Spring Boot"]');
    if (defaultNode) inspect(defaultNode);

    /* ---------------- project filters ---------------- */
    var filters = $$(".filter"), projects = $$(".project"), echo = $("#filterEcho"), empty = $("#projEmpty");
    // If an odd number of regular cards is visible, stretch the last one across the row
    function balanceGrid() {
        var visible = projects.filter(function (p) {
            p.classList.remove("span-full");
            return !p.classList.contains("is-hidden") && !p.classList.contains("project-featured");
        });
        if (visible.length % 2 === 1) visible[visible.length - 1].classList.add("span-full");
    }
    balanceGrid();
    filters.forEach(function (f) {
        f.addEventListener("click", function () {
            var cat = f.dataset.filter, shown = 0;
            filters.forEach(function (x) {
                x.classList.toggle("is-on", x === f);
                x.setAttribute("aria-pressed", String(x === f));
            });
            projects.forEach(function (p) {
                var show = cat === "all" || p.dataset.cat.split(" ").indexOf(cat) > -1;
                p.classList.toggle("is-hidden", !show);
                if (show) shown++;
            });
            empty.hidden = shown > 0;
            balanceGrid();
            echo.textContent = cat;
            var pc = $("#projCount");
            pc.textContent = shown;
            pc.classList.remove("bump"); void pc.offsetWidth; pc.classList.add("bump");
            fireRequest("GET", "/projects?filter=" + cat);
        });
    });

    /* ---------------- copy email ---------------- */
    var copyBtn = $("#copyEmail");
    copyBtn.addEventListener("click", function () {
        var email = $("#emailText").textContent;
        var done = function () {
            copyBtn.classList.add("done");
            copyBtn.querySelector("span").textContent = "Copied";
            fireRequest("POST", "/contact", "201 Created");
            setTimeout(function () {
                copyBtn.classList.remove("done");
                copyBtn.querySelector("span").textContent = "Copy email";
            }, 2000);
        };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(done, function () { window.location.href = "mailto:" + email; });
        } else {
            window.location.href = "mailto:" + email;
        }
    });

    /* ---------------- résumé modal ---------------- */
    var modal = $("#resumeModal"), frame = $("iframe", modal), lastFocus = null;
    function openResume() {
        lastFocus = document.activeElement;
        if (!frame.src) frame.src = frame.dataset.src;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        $("#closeResume").focus();
    }
    function closeResume() {
        modal.hidden = true;
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
    }
    $$("[data-open-resume]").forEach(function (b) { b.addEventListener("click", openResume); });
    $("#closeResume").addEventListener("click", closeResume);
    modal.addEventListener("click", function (e) { if (e.target === modal) closeResume(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeResume(); });
})();
