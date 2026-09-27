---
title: "Le combat"
description: "Le déroulement d'un combat, la surprise, l'initiative, votre tour, se déplacer, attaquer, la Classe d'armure, agir hors de son tour, la Concentration et les états."
---

Le combat n'a pas de règles de résolution à lui : on y lance les mêmes {{jet|Jets}} que partout ailleurs. Ce qu'il ajoute, c'est un ordre de passage et un budget par tour, pour que chacun agisse à son tour quand tout se passe en même temps.

## Le déroulement d'un combat

Un combat se découpe en rounds. Un round dure environ 6 secondes, le temps que chaque créature joue son tour.

1. **Les positions.** Le MJ décrit où se trouvent les créatures et ce qui les entoure. Les joueurs disent où sont leurs personnages.
2. **La surprise.** Le MJ dit si une créature est surprise.
3. **L'initiative.** Chacun lance son initiative, qui fixe l'ordre des tours.
4. **Les tours.** Chaque créature joue son tour dans cet ordre.
5. **Le round suivant.** Quand tout le monde a joué, un nouveau round commence, dans le même ordre, jusqu'à la fin du combat.

## La surprise

Quand un camp tombe sur l'autre sans l'avoir vu venir, une embuscade réussie par exemple, le MJ déclare surprises les créatures qui ne s'y attendaient pas.

Au premier round, une créature surprise joue son tour après toutes celles qui ne le sont pas, dans l'ordre de leurs initiatives. Elle ne peut jouer aucune {{reaction}} avant la fin de ce premier tour.

## L'initiative

Au début d'un combat, chaque personnage joueur lance :

`1d4 + {{dexterite}}`

On agit du résultat le plus élevé au plus faible. Les joueurs l'emportent sur leurs adversaires à égalité, et ils se départagent librement entre eux.

Le dé est petit exprès. Un écart de {{dexterite}} pèse lourd dans cet ordre, plus que dans n'importe quel autre {{jet}} du jeu.

L'ordre est fixé pour tout le combat. On ne le relance pas à chaque round.

### Deux variantes

Le MJ peut lancer une seule fois pour un groupe de créatures identiques, et séparément pour chaque créature majeure. Cela raccourcit un combat à nombreux adversaires sans rien changer aux règles.

Il peut aussi regrouper les positions alliées qui se suivent sans adversaire entre elles. Les alliés d'un même bloc entrelacent alors leurs {{deplacement|déplacements}} et leurs actions. Chacun garde son propre début et sa propre fin de tour, ce qui compte pour tout effet qui s'y déclenche, et les {{reaction|Réactions}} interrompent normalement.

## Votre tour

À votre tour, vous disposez de quatre choses. Elles sont indépendantes : ne pas en utiliser une ne vous en rend pas une autre.

Une {{action}}
: La plupart des Compétences s'y jouent, à commencer par {{ATTAQU-001}}.

Une {{action-bonus}}
: Une action rapide, réservée aux Compétences qui l'indiquent. Elle ne remplace pas l'{{action}}, et rien ne la convertit.

Un {{deplacement}}
: Jusqu'à votre {{vitesse}}, 9 mètres sauf si votre Espèce en fixe une autre. Il se répartit librement avant, pendant et après vos actions.

Une {{reaction}}
: Quand une règle vous fournit un déclencheur, le plus souvent hors de votre tour. Elle revient au début de votre tour suivant.

> [!EXAMPLE] Exemple
>
> À son tour, Sélène recule de 6 mètres pour sortir du contact d'un loup, joue {{ATTAQU-001}} avec son arc sur un autre loup, puis se glisse de 3 mètres derrière un rocher. Elle a utilisé son {{deplacement}} en deux fois et son {{action}}. Il lui reste son {{action-bonus}}, qu'aucune de ses Compétences n'utilise ce tour-ci, et sa {{reaction}} pour le tour des loups.
>
> En reculant, elle a quitté l'allonge du premier loup : il peut jouer son {{ATTOPP-001}}. Pour l'éviter, il lui aurait fallu jouer {{DESENG-001}}, au prix de son {{action}}.

## Se déplacer

Tout se compte par pas de 1,5 mètre. Le contact est à 1,5 mètre, une arme d'allonge porte à 3 mètres, et les portées à distance courantes sont de 9, 12 et 18 mètres.

Vous pouvez couper votre {{deplacement}} autant de fois que vous le voulez dans votre tour, tant que le total ne dépasse pas votre {{vitesse}}.

Terrain difficile
: Des gravats, une pente raide, une eau jusqu'aux genoux ou une foule serrée ralentissent la marche. Chaque mètre parcouru en terrain difficile en coûte deux.

Se relever
: Une créature {{a-terre}} se relève en dépensant la moitié de sa {{vitesse}}, à son tour.

Quitter un adversaire
: Quitter l'allonge d'une créature qui vous voit lui permet de jouer son {{ATTOPP-001}}, sauf si vous avez joué {{DESENG-001}} ce tour-ci.

Votre {{vitesse}} peut tomber à 0, et certains états y parviennent. Une {{vitesse}} de 0 n'empêche pas d'agir : vous gardez votre {{action}}, votre {{action-bonus}} et votre {{reaction}}.

## Attaquer

L'action {{ATTAQU-001}} porte une {{attaque}} avec une arme équipée ou à mains nues.

Effectuez le {{jet}} que l'arme indique contre la {{ca}} de la cible. En cas de réussite, la cible subit les dégâts de l'arme, augmentés de la {{caracteristique}} employée par ce {{jet}}.

Cette {{caracteristique}} s'ajoute toujours. C'est la même des deux côtés du calcul : celle qui vous a permis de toucher est celle qui alourdit le coup.

Sans arme, une Frappe se résout avec un {{jet}} de `{{force}} + {{melee}}`, à 1,5 mètre, pour `1d4 + {{force}}` dégâts.

### Ce qu'une arme indique

Chaque arme imprime sa propre ligne, et c'est elle qui fait foi :

- la {{caracteristique}} et l'{{aptitude}} de son {{jet}} ;
- une portée, et une seule ;
- ses dés et son type de dégâts ;
- ses propriétés.

Une cible au-delà de la portée ne peut pas être attaquée, sauf si une propriété de l'arme le permet.

Tout ce qu'une arme fait d'inhabituel passe par une propriété nommée, imprimée sur elle. Une arme Finesse permet d'échanger `{{force}} + {{melee}}` contre `{{dexterite}} + {{finesse}}`. Deux armes Légères, une dans chaque main, ouvrent une {{attaque}} en {{action-bonus}}.

## La Classe d'armure

La {{ca}} est le nombre qu'une {{attaque}} doit atteindre pour vous toucher. Sans armure :

`{{ca}} = 12 + {{dexterite}}`

Une armure portée efface cette formule et impose la sienne. **Elle ne s'ajoute jamais à 12.** C'est la règle qu'on oublie le plus souvent.

Une seule formule de base s'applique à la fois, celle de la pièce qui occupe l'emplacement Torse. Les boucliers et les autres modificateurs explicites s'ajoutent ensuite, par-dessus le résultat.

1. Prenez la formule de votre armure, ou `12 + {{dexterite}}` si vous n'en portez pas.
2. Ajoutez le bouclier.
3. Ajoutez les autres modificateurs explicites, pièce par pièce.

> [!EXAMPLE] Exemple
>
> Sans armure, avec une {{dexterite}} de +3, votre {{ca}} est de 15. Enfilez une armure en `14 + {{dexterite}}` et elle passe à 17, jamais à 29. Ajoutez une targe et elle monte à 18.

Chaque armure imprime sa propre formule, et certaines plafonnent la {{dexterite}} qu'elles laissent compter ou exigent une {{force}} minimale. Lisez la pièce : elle porte ses contraintes.

### Précision et couvert

La {{ca}} d'une créature n'est pas figée. Le MJ peut la déplacer de trois crans au plus, selon ce que vous visez exactement et ce qui protège la cible.

| Ajustement | Difficulté relative |
| ---: | --- |
| −3 | Beaucoup plus facile |
| −2 | Plus facile |
| −1 | Légèrement plus facile |
| 0 | Normal |
| +1 | Légèrement plus difficile |
| +2 | Plus difficile |
| +3 | Beaucoup plus difficile |

Un muret, un tronc ou une porte entrouverte protègent en partie ; viser une main plutôt que le torse demande plus de précision. Au-delà de trois crans, ce n'est plus une difficulté mais une impossibilité : une cible entièrement à couvert ne peut pas être touchée, et aucun ajustement ne la rend atteignable.

## Agir hors de son tour

Votre {{reaction}} est votre seule façon d'agir pendant le tour d'un autre, et vous n'en avez qu'une par round. Elle se joue quand une règle vous en donne le déclencheur.

Deux Compétences de base en fournissent un à tout le monde. {{ATTOPP-001}} frappe une créature qui quitte votre allonge. {{PREPAR-001}} garde une action en réserve pour un moment que vous annoncez : « dès qu'il passe la porte, je tire ». D'autres Compétences en ajoutent, et leur fiche nomme le déclencheur.

## La Concentration

Certaines Compétences durent tant que vous vous concentrez : leur durée porte la mention {{concentration}}. Vous ne maintenez qu'une Compétence de {{concentration}} à la fois, et en jouer une autre met fin à la première.

Chaque fois que vous subissez des dégâts pendant que vous en maintenez une, effectuez un {{jet}} de {{constitution}} + {{volonte}} contre un {{dd}} de 15 pour maintenir votre {{concentration}}. En cas d'échec, elle prend fin.

Votre {{concentration}} prend fin aussi lorsque vous gagnez {{agonie}}, lorsque vous êtes {{endormi}}, {{sonne}} ou {{enrage}}, et lorsque vous y mettez fin, ce qui ne vous coûte rien.

## Les états

Un état est une condition nommée qui modifie les règles tant qu'elle dure, comme {{aveugle}}, {{entrave}} ou {{a-terre}}. Sa fiche dit ce qu'il fait et comment il prend fin. Quand elle n'en fixe pas la durée, le {{dd}} ou les dégâts, la Compétence ou l'objet qui l'applique les indique.

Certains portent une Intensité, écrite après leur nom, comme {{combustion}} 3. Réappliquer le même état conserve l'Intensité la plus élevée, sauf si son texte précise qu'elles s'additionnent.

Pour une conséquence improvisée, le MJ n'a pas besoin d'un état écrit. Il peut accorder un {{avantage}} ou un {{desavantage}} jusqu'à ce que la fiction y mette logiquement fin.

La page Règles et l'index des états portent la liste complète.
