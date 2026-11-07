---
kind: "privacy"
title: "Confidentialité"
description: "Ce site ne collecte aucune donnée sur vous et ne garde dans votre navigateur que six réglages et une note sur ce que votre appareil sait dessiner."
---

Ce site est un ensemble de pages statiques. Il n'y a ni compte, ni formulaire, ni base de données.

## Ce qui n'existe pas ici

Pas de mesure d'audience, pas de traceur publicitaire, pas de cookie, pas de bouton de réseau social, aucun script tiers. La politique de sécurité envoyée avec chaque page n'autorise que les scripts du site lui-même : le navigateur refuse tout script venu d'un autre domaine.

## Ce qui reste dans votre navigateur

Six réglages sont mémorisés quand vous les changez :

- le thème clair ou sombre, sous la clé `aubaine.theme` ;
- le masquage des brouillons dans les listes, sous la clé `aubaine.drafts` ;
- le son (activé ou coupé, volume général, volumes de l'ambiance, des effets et de l'interface), sous la clé `aubaine.sound` ;
- la mise en pause des animations sur les pages Espèces et Arbres, ainsi que sur la page de chaque Espèce et de chaque Arbre (le fond en haut de page et le drapeau d'une sous-espèce), sous la clé `aubaine.stage` ;
- la vue de la carte de l'Atlas (dessus, 3/4, relief ou libre), sous la clé `aubaine.atlas.view` ;
- les options de l'Atlas (qualité d'affichage, effet d'écran, rendu 3D ou parchemin, légende ouverte ou fermée, éléments montrés sur la carte), sous la clé `aubaine.atlas.settings`.

Le site enregistre lui-même une septième clé, `aubaine.gpu`, chaque fois que la carte graphique dessine l'une de ces images : le fond en haut d'une page d'Espèce ou d'Arbre, un tableau sous verre, ou la bannière, le drapeau ou les armoiries d'une sous-espèce. Cette clé retient ce que votre appareil sait dessiner, pour que les pages suivantes cachent la version simple d'une image jusqu'à ce que la carte graphique ait fini de la dessiner. Si votre navigateur ne peut plus se servir de la carte graphique, le site l'efface.

Toutes ces clés restent dans votre navigateur et ne sont envoyées nulle part. Effacer les données du site les supprime.

## L'hébergement

Les pages sont servies par Cloudflare, qui traite les requêtes nécessaires à la livraison des fichiers comme le fait tout serveur web. Aubaine n'y ajoute aucune collecte, et ne reçoit aucune donnée sur vous.
