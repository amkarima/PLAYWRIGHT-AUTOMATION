# Dashboard QA2

Tableau de bord de tests automatisés et manuels avec support des logos partenaires.

## Nouvelles fonctionnalités

### Logos partenaires

Les logos des partenaires sont maintenant intégrés dans l'interface :

- Printemps (vert avec P doré)
- La Redoute (rouge avec texte blanc)
- Darty, Fnac, Ikea, Sofinco

### Modes de test

1. **Mode Automatique** : Sélection et lancement de tests automatisés
   - Affichage des logos dans les cartes de test
   - Filtrage par type de test
   - Pagination
   - Sélection multiple

2. **Mode Manuel** : Génération d'URLs de test
   - Affichage des logos pour chaque preset
   - Filtrage par partenaire et type de contrat
   - Génération de QR codes
   - Ouverture en mode simulateur mobile

## Documentation

- `LOGOS_INTEGRATION.md` - Guide d'intégration des logos
- `CHANGELOG_LOGOS.md` - Détails des modifications

## Démarrage

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
