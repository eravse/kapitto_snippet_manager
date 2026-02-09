# Git Branching Strategy: Pro & Lite Separation

To manage both a **Lite (Public)** and **Pro (Private)** version within the same repository, we will use a **Branch-based Strategy**.

## 1. Branch Structure

- **`main` (or `lite`)**: This branch contains **only the Open Source / Lite** version. This is what you push to your public GitHub repository.
- **`pro`**: This branch contains **all code from `main` PLUS Pro features**. This is kept in your private repository or local machine.

## 2. Setup (First Time)

Since you currently have the Pro version active:

1.  **Rename Current Branch to `pro`**:
    ```bash
    git branch -m main pro
    ```
2.  **Create Lite Branch**:
    ```bash
    git checkout -b main
    ```
3.  **Strip Pro Features (Only on `main` branch)**:
    -   Delete `components/IntegrationSettings.tsx`.
    -   Delete `app/api/admin/license/...` folder.
    -   Remove `IntegrationSettings` imports from `app/profile/page.tsx`.
    -   Remove source control buttons from Admin page.
    -   Commit these removals: `git commit -am "chore: remove pro features for lite version"`
4.  **Pushing**:
    -   Add Private Remote: `git remote add origin_pro <PRIVATE_REPO_URL>`
    -   Add Public Remote: `git remote add origin_public <PUBLIC_REPO_URL>`
    -   Push Pro: `git push origin_pro pro`
    -   Push Lite: `git push origin_public main`

## 3. Development Workflow

### Case A: Common Features/Bug Fixes (Lite & Pro)
Always develop common features on the `main` (Lite) branch.

1.  `git checkout main`
2.  Make changes (e.g., fix a bug in SnippetCard).
3.  Commit changes.
4.  **Propagate to Pro**:
    ```bash
    git checkout pro
    git merge main
    ```
    *(This ensures Pro always has the latest core updates).*

### Case B: Pro-Only Features
Develop these directly on the `pro` branch.

1.  `git checkout pro`
2.  Make changes (e.g., update License logic).
3.  Commit.
4.  **Do NOT merge back to main**.

## 4. Automation (Optional)

You can use a `.gitignore` in the `pro` branch to force-ignore certain files, but merging is usually safer.
Always review `git diff main pro` to ensure no Pro leaks occur before pushing `main`.
