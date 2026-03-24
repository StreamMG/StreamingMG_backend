#!/bin/bash
cd src/models
for file in *.js; do
  if [[ "$file" != *".model.js" ]]; then
    mv "$file" "${file%.js}.model.js"
  fi
done

cd ../../
# Remplacer les requires dans tous les js
find src scripts -name "*.js" -type f -exec sed -i \
  -e "s/require(['\"]\.\.\/models\/User['\"])/require('\.\.\/models\/User.model')/g" \
  -e "s/require(['\"]\.\.\/\.\.\/src\/models\/User['\"])/require('\.\.\/\.\.\/src\/models\/User.model')/g" \
  -e "s/require(['\"]\.\.\/src\/models\/User['\"])/require('\.\.\/src\/models\/User.model')/g" \
  -e "s/require(['\"]\.\.\/models\/Content['\"])/require('\.\.\/models\/Content.model')/g" \
  -e "s/require(['\"]\.\.\/\.\.\/src\/models\/Content['\"])/require('\.\.\/\.\.\/src\/models\/Content.model')/g" \
  -e "s/require(['\"]\.\.\/src\/models\/Content['\"])/require('\.\.\/src\/models\/Content.model')/g" \
  -e "s/require(['\"]\.\.\/models\/Purchase['\"])/require('\.\.\/models\/Purchase.model')/g" \
  -e "s/require(['\"]\.\.\/models\/Transaction['\"])/require('\.\.\/models\/Transaction.model')/g" \
  -e "s/require(['\"]\.\.\/models\/RefreshToken['\"])/require('\.\.\/models\/RefreshToken.model')/g" \
  -e "s/require(['\"]\.\.\/models\/WatchHistory['\"])/require('\.\.\/models\/WatchHistory.model')/g" \
  -e "s/require(['\"]\.\.\/models\/TutorialProgress['\"])/require('\.\.\/models\/TutorialProgress.model')/g" \
  -e "s/require(['\"]\.\.\/models\/Playlist['\"])/require('\.\.\/models\/Playlist.model')/g" {} +

echo "Alignment done"
