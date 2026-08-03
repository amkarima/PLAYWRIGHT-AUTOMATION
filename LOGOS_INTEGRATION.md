# Intégration des logos partenaires

## Logos ajoutés

Les tests pour les partenaires suivants ont été configurés avec des logos :

- ✅ **Printemps** - Logo vert avec le "P" jaune/or
- ✅ **La Redoute** - Logo rouge avec texte blanc
- ✅ Darty - Logo généré (placeholder)
- ✅ Fnac - Logo généré (placeholder)
- ✅ Ikea - Logo généré (placeholder)
- ✅ Sofinco - Utilise le logo existant

## Tests ajoutés

Quatre nouveaux tests ont été ajoutés pour Printemps et La Redoute :

1. **PRINTEMPS - CRS < 3000€ prospect** (SOF-160001) - Type: CL web
2. **PRINTEMPS - CRA > 3000€ prospect** (SOF-160002) - Type: CEASY x Essentiel
3. **LA REDOUTE - CRS < 3000€ prospect** (SOF-160003) - Type: CL web
4. **LA REDOUTE - CRA > 3000€ prospect** (SOF-160004) - Type: CEASY x Essentiel

## Emplacements des fichiers

### Logos actuels (SVG temporaires)
- `/public/images/logo-printemps.svg` - Logo temporaire Printemps
- `/public/images/logo-redoute.svg` - Logo temporaire La Redoute

### Pour remplacer par les vrais logos

Si vous avez les vrais logos au format PNG ou SVG, placez-les dans :
- `/public/images/logo-printemps.png` ou `.svg`
- `/public/images/logo-redoute.png` ou `.svg`

Puis mettez à jour le fichier `/src/utils/partnerLogos.ts` si nécessaire pour pointer vers les bons fichiers.

## Configuration des logos

La configuration des logos se trouve dans `/src/utils/partnerLogos.ts`. Ce fichier contient :

- Les chemins vers les fichiers de logos
- Les couleurs de marque pour chaque partenaire
- La fonction `getPartnerLogo()` pour récupérer les informations de logo
- La fonction `getPartnerColor()` pour obtenir la couleur de marque

## Affichage des logos

Les logos sont affichés dans trois endroits :

1. **Dans la grille de sélection des tests automatiques** (`TriggerTestModal` - Mode Auto) :
   - Logo 48x48px dans un conteneur carré avec bordure
   - Affiché à gauche du nom du test
   - Effet de sélection avec ring vert

2. **Dans la liste des tests sélectionnés** :
   - Petite icône 16x16px à côté du nom du test
   - Badge vert avec le nom du test

3. **Dans la grille de sélection des tests manuels** (`TriggerTestModal` - Mode Manuel) :
   - Logo 48x48px dans un conteneur carré avec bordure
   - Affiché en haut à gauche de la carte
   - Badges pour le partenaire et le type de source
   - Effet de sélection avec ring bleu

## Personnalisation

Pour ajouter un nouveau partenaire :

1. Ajoutez le type dans `/src/utils/partnerLogos.ts` :
   ```typescript
   export type Partner = 'printemps' | 'redoute' | 'nouveau_partenaire' | ...;
   ```

2. Ajoutez la configuration du logo :
   ```typescript
   nouveau_partenaire: {
     src: '/images/logo-nouveau-partenaire.svg',
     alt: 'Nouveau Partenaire',
     bgColor: '#COULEUR'
   }
   ```

3. Ajoutez la couleur de marque :
   ```typescript
   nouveau_partenaire: '#COULEUR'
   ```

4. Créez les tests avec la propriété `partner: 'nouveau_partenaire'` dans `TriggerTestModal.tsx`
