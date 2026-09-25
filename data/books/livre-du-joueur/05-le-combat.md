---
title: "Le combat"
description: "L'économie du tour, l'initiative, attaquer, la Classe d'armure, les types de dégâts, tomber à 0 PdV et les états."
---

Le combat n'a pas de règles de résolution à lui. On y lance les mêmes Jets que partout ailleurs. Ce qu'il ajoute, c'est un ordre de passage et un budget par tour.

## Votre tour

Un round dure environ 6 secondes, le temps que chaque créature joue son tour.

À votre tour, vous disposez de quatre choses. Elles sont indépendantes : ne pas en utiliser une ne vous en rend pas une autre.

Une Action
: La plupart des Compétences s'y jouent, à commencer par {{Attaquer}}.

Une Action Bonus
: Une action rapide, généralement réservée aux Compétences qui l'indiquent. Elle ne remplace pas l'Action, et rien ne la convertit.

Un déplacement
: Votre Vitesse, 9 mètres par défaut. Il se répartit librement avant, pendant et après vos actions.

Une Réaction
: Hors de votre tour, quand une règle vous fournit un déclencheur. Elle revient au début de votre tour suivant.

### Les distances

Tout se compte par pas de 1,5 mètre. Le contact est à 1,5 mètre, une arme d'allonge porte à 3 mètres, et les portées à distance courantes sont 9, 12 et 18 mètres.

Vous pouvez couper votre déplacement autant de fois que vous le voulez dans votre tour, tant que le total reste dans votre Vitesse.

Votre Vitesse peut tomber à 0, et certains états y parviennent. Un déplacement de 0 n'empêche pas d'agir : vous gardez votre Action, votre Action Bonus et votre Réaction.

## L'initiative

Au début d'un combat, chaque personnage joueur lance :

`1d4 + Dextérité`

On agit du résultat le plus élevé au plus faible. Les joueurs l'emportent sur leurs adversaires à égalité, et ils départagent librement entre eux.

Le dé est petit exprès. Un écart de Dextérité pèse lourd dans cet ordre, plus que dans n'importe quel autre Jet du jeu.

L'ordre est fixé pour tout le combat. On ne le relance pas à chaque round.

### Deux variantes

Le MJ peut lancer une seule fois pour un groupe de créatures identiques, et séparément pour chaque créature majeure. Cela raccourcit un combat à nombreux adversaires sans rien changer aux règles.

Il peut aussi regrouper les positions alliées qui se suivent sans adversaire entre elles. Les alliés d'un même bloc entrelacent alors leurs déplacements et leurs actions. Chacun garde son propre début et sa propre fin de tour, ce qui compte pour tout effet qui s'y déclenche, et les Réactions interrompent normalement.

## Attaquer

L'action {{Attaquer}} porte une attaque avec une arme équipée ou à mains nues.

Effectuez le Jet que l'arme indique contre la CA de la cible. En cas de réussite, la cible subit les dégâts de l'arme, augmentés de la Caractéristique employée par ce Jet.

Cette Caractéristique s'ajoute toujours. C'est la même des deux côtés du calcul : celle qui vous a permis de toucher est celle qui alourdit le coup.

Sans arme, une Frappe se résout avec un Jet de `Force + Mêlée`, à 1,5 mètre, pour `1d4 + Force` dégâts.

### Ce qu'une arme indique

Chaque arme imprime sa propre ligne, et c'est elle qui fait foi :

- la Caractéristique et l'Aptitude de son Jet ;
- une portée, et une seule ;
- ses dés et son type de dégâts ;
- ses propriétés.

Une cible au delà de la portée ne peut pas être attaquée. Aucune règle générale ne permet de tirer plus loin en acceptant un malus ; il faut une propriété qui le dise.

Tout ce qu'une arme fait d'inhabituel passe par une propriété nommée, imprimée sur elle. Une arme Finesse laisse échanger `Force + Mêlée` contre `Dextérité + Finesse`. Deux armes Légères, une dans chaque main, ouvrent une attaque en Action Bonus.

## La Classe d'armure

La CA est le nombre qu'une attaque doit atteindre pour vous toucher. Sans armure :

`CA = 12 + Dextérité`

Une armure portée efface cette formule et impose la sienne. **Elle ne s'ajoute jamais à 12.** C'est la règle qu'on oublie le plus souvent.

Une seule formule de base s'applique à la fois, celle de la pièce occupant l'emplacement Armure. Les boucliers et les autres modificateurs explicites s'ajoutent ensuite, par dessus le résultat.

1. Prenez la formule de votre armure, ou `12 + Dextérité` si vous n'en portez pas.
2. Ajoutez le bouclier.
3. Ajoutez les autres modificateurs explicites, pièce par pièce.

Un exemple. Sans armure avec une Dextérité de +3, votre CA est 15. Enfilez une armure en `14 + Dextérité` et elle passe à 17, pas à 29. Ajoutez une targe et elle monte à 18.

Chaque armure imprime sa propre formule, et certaines plafonnent la Dextérité qu'elles laissent compter ou exigent une Force minimale. Lisez la pièce : elle porte ses contraintes.

## Les types de dégâts

Des dégâts peuvent porter un type, comme les dégâts Contondants ou les dégâts de Feu. Une arme imprime le sien, et une Compétence le nomme quand ses dégâts en portent un.

Une créature peut avoir une résistance ou une vulnérabilité à un type de dégâts, à une source de dégâts, ou à tous les dégâts, qu'ils portent un type ou non. Avec une résistance, elle subit la moitié des dégâts concernés, arrondie à l'inférieur. Avec une vulnérabilité, elle en subit le double. Aucune des deux ne demande de Jet : elles s'appliquent au total, une fois les dés lancés.

Quand d'autres règles modifient les mêmes dégâts, procédez dans cet ordre :

1. Totalisez les dégâts avec tout ce qui les augmente ou les réduit d'un nombre fixe, comme la Caractéristique d'une attaque ou « vous en subissez 1 de moins ».
2. Si la Compétence n'en inflige que la moitié, sur une réussite par exemple, divisez ce total par deux, arrondi à l'inférieur.
3. Divisez le résultat par deux en cas de résistance, ou doublez-le en cas de vulnérabilité.

Quand un même coup inflige des dégâts de plusieurs types, une résistance ou une vulnérabilité ne touche que la part de son type. Ce qui s'ajoute sans nommer de type, comme la Caractéristique d'une attaque, compte avec les dégâts de l'arme ou de la Compétence. Ce qui retire un nombre fixe sans nommer de type, comme « vous en subissez 1 de moins », se retire de la part la plus forte.

Des dégâts réduits à 0 ne comptent pas comme des dégâts subis, et ne font donc pas descendre le compteur d'[[Agonie]].

Une résistance et une vulnérabilité qui touchent les mêmes dégâts s'annulent, et ces dégâts ne changent pas. Une résistance reçue de deux sources ne s'applique qu'une fois, selon la règle « Deux fois le même effet » du chapitre Comment jouer, tout comme une vulnérabilité. Deux résistances et une vulnérabilité aux mêmes dégâts s'annulent donc encore.

Un exemple. Un coup de 10 dégâts Contondants frappe une créature qui en subit 1 de moins et qui a une résistance aux dégâts Contondants : elle en subit 4, la moitié de 9 arrondie à l'inférieur. Avec une vulnérabilité à la place, elle en subirait 18.

## Tomber à 0 PdV

Vos PdV ne descendent jamais sous 0. Une créature qui y tombe gagne [[Agonie]] 3 et commence à mourir.

Le compteur descend de 1 à la fin de chacun de ses tours, mais pas pendant le tour où elle l'a reçu. Elle a donc trois de ses propres tours avant la fin. Prendre des dégâts lui en coûte un de plus, une fois au plus par action adverse.

À 0, la créature meurt.

Pendant ce temps elle est [[À terre]] sans pouvoir se relever, et elle ne peut plus jouer quoi que ce soit qui coûte de l'Énergie.

### Relever quelqu'un

Tout soin qui rend au moins 1 PdV met fin à [[Agonie]] immédiatement. Le compteur ne se retient pas : un point rendu suffit, quelle que soit sa valeur.

Sans magie ni potion, une Action et un Jet réussi d'Intelligence + Médecine contre un DD de 20 rendent 1 PdV, ce qui met fin à l'état.

Dans les deux cas la créature reste [[À terre]]. Se relever coûte la moitié de son déplacement, à son tour.

Trois tours, c'est court mais ce n'est pas immédiat. Un allié à terre est un problème à résoudre pendant le combat, pas après, et il le reste même si personne ne le frappe plus.

## Les états

Un état est une condition nommée qui modifie les règles tant qu'elle dure. Sa fiche dit ce qu'il fait et comment il prend fin. Quand elle n'en fixe pas la durée, le DD ou les dégâts, la Compétence ou l'objet qui l'applique les indique.

Certains portent une Intensité, écrite après leur nom, comme [[Combustion]] 3. Réappliquer le même état conserve l'Intensité la plus élevée, sauf si son texte précise qu'elles s'additionnent.

Pour une conséquence improvisée, le MJ n'a pas besoin d'un état écrit. Il peut accorder un Avantage ou un Désavantage jusqu'à ce que la fiction y mette logiquement fin.
