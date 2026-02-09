export const EXECUTABLE_PATTERNS = [
    /#!(\/usr\/bin\/env|\/bin\/bash|\/bin\/sh|\/usr\/bin\/python|\/usr\/bin\/node)/, // Shebang
    /\b(sudo|rm -rf|mkfs|dd if=|chmod \+x|chown|systemctl|service|apt-get|yum|dnf)\b/, // Destructive/System commands
    /\b(exec|system|passthru|shell_exec|popen)\b\s*\(/, // Executable functions in PHP/C/JS
    /\b(child_process\.exec|child_process\.spawn)\b/, // Node.js child process
    /\b(subprocess\.run|os\.system|os\.popen)\b/, // Python subprocess
    /import\s+os|import\s+subprocess|import\s+child_process/, // Sensitive imports
];

export function isExecutableCode(code: string): boolean {
    return EXECUTABLE_PATTERNS.some(pattern => pattern.test(code));
}

export function redactSensitiveData(details: string): string {
    // Simple redactor for passwords or keys in audit logs if needed
    return details.replace(/(password|secret|key|token)=([^\s&]+)/gi, '$1=********');
}
