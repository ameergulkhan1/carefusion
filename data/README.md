# Data Folder

This folder holds training data and archives used locally by the ML service.

**Contents are NOT committed to Git** to avoid bloating the repository.

## Structure

- `archive-1/` — Training data batch 1
- `archive-2/` — Training data batch 2

## Deployment Note

Files here are **not deployed to Vercel**. If the ML service needs model artifacts at runtime:

1. Small models → place them inside `apps/ml-service/` so they're bundled with the deployment
2. Large models → upload to cloud storage (S3, R2, Vercel Blob) and fetch at runtime

Do not import files from this folder in the frontend or backend source code.
