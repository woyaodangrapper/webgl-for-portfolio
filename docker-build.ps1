$IMAGE = "nmolirsch/woyaodangrapper"
$TAG = "latest"

Write-Host ">>> Building ${IMAGE}:${TAG} ..." -ForegroundColor Cyan
docker build -t "${IMAGE}:${TAG}" .
if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed!" -ForegroundColor Red
  exit 1
}

Write-Host ">>> Pushing ${IMAGE}:${TAG} ..." -ForegroundColor Cyan
docker push "${IMAGE}:${TAG}"
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed!" -ForegroundColor Red
  exit 1
}

Write-Host ">>> Done: ${IMAGE}:${TAG}" -ForegroundColor Green
