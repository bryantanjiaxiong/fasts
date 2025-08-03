
function loadGA() {
    // Dynamically load the GA script
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-5YGZ8K86JH';
    document.head.appendChild(gaScript);
    gaScript.onload = function() {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-J83EW9X1JV');
    };
}

function setGameEnabled(enabled) {
    // Disable or enable all game buttons
    const buttons = document.querySelectorAll('.level-button');
    buttons.forEach(btn => {
        if (btn.id !== 'consent-accept') {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? '1' : '0.5';
            btn.style.pointerEvents = enabled ? 'auto' : 'none';
        }
    });
    // Optionally, disable other interactive elements here
}

function showConsentPopup() {
    if (!localStorage.getItem('ga_consent')) {
        document.getElementById('consent-popup').style.display = 'block';
        setGameEnabled(false);
    } else {
        setGameEnabled(true);
        loadGA();
    }
}
function acceptConsent() {
    localStorage.setItem('ga_consent', 'true');
    document.getElementById('consent-popup').style.display = 'none';
    setGameEnabled(true);
    loadGA();
}
document.addEventListener('DOMContentLoaded', function() {
    showConsentPopup();
    document.getElementById('consent-accept').onclick = acceptConsent;
});
