$ErrorActionPreference = "Stop"

# Ensure dist exists
if (-not (Test-Path "dist\index.html")) {
    Write-Error "dist\index.html not found! Run npm run build first."
    exit 1
}

# Create a temporary index file for git
$env:GIT_INDEX_FILE = "$PWD\.git\temp_index"
if (Test-Path $env:GIT_INDEX_FILE) {
    Remove-Item -Force $env:GIT_INDEX_FILE
}

try {
    # Add dist contents to temporary index
    git --work-tree=dist add -A
    $tree = git write-tree
    Write-Host "Created git tree: $tree"

    # Create a commit from that tree
    $commit = git commit-tree $tree -m "Deploy production bundle to gh-pages"
    Write-Host "Created commit: $commit"

    # Push to gh-pages branch on origin
    Write-Host "Pushing to origin gh-pages branch..."
    git push origin "${commit}:refs/heads/gh-pages" --force
    Write-Host "Successfully deployed to gh-pages branch!"
} finally {
    if (Test-Path $env:GIT_INDEX_FILE) {
        Remove-Item -Force $env:GIT_INDEX_FILE
    }
}
