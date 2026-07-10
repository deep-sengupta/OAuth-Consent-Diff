set -eu
sh scripts/build.sh
rm -rf dist
mkdir -p dist
zip -qr dist/oauth-consent-diff.zip manifest.json package.json extension assets scripts tests -x "*.DS_Store" "*.md"
echo "Created dist/oauth-consent-diff.zip"
