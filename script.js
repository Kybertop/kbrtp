/* ==========================================================================
   kbrtp.top — Invite Code Authenticator Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const inviteForm = document.getElementById('invite-form');
    const inviteInput = document.getElementById('invite-input');
    const accessStatus = document.getElementById('access-status');

    // Demo valid invite codes
    const VALID_CODES = ['KBRTP-2026', 'ALPHA-VIP', 'KBRTP-INVITE'];

    if (inviteForm) {
        inviteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = inviteInput.value.trim().toUpperCase();
            
            if (!code) return;

            if (VALID_CODES.includes(code)) {
                accessStatus.className = 'status-msg success';
                accessStatus.textContent = '✓ INVITE KEY VERIFIED. INITIALIZING ACCESS...';
            } else {
                accessStatus.className = 'status-msg error';
                accessStatus.textContent = '✕ ACCESS DENIED: Invalid invite code.';
            }
        });
    }
});
