document.addEventListener('DOMContentLoaded', () => {
    const tutorialModal = document.getElementById('tutorial-modal');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const closeBtn = document.getElementById('close-tutorial');
    
    tutorialBtn.addEventListener('click', () => {
        tutorialModal.classList.add('show');
    });
    
    closeBtn.addEventListener('click', () => {
        tutorialModal.classList.remove('show');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.classList.remove('show');
        }
    });
    
    const switchSideBtn = document.getElementById('switch-side-btn');
    switchSideBtn.addEventListener('click', () => {
        if (window.game) {
            window.game.switchSide();
        }
    });

    const board = document.getElementById('board');
    const observer = new MutationObserver(() => {
        setTimeout(() => {
            if (window.smartAI) {
                window.smartAI.act();
            }
        }, 200);
    });

    observer.observe(board, { childList: true, subtree: true });
});