---
title: "Dégâts et soins"
description: "Les PdV, les dégâts et leurs types, résistance et vulnérabilité, tomber à 0 PdV et l'Agonie, les soins et les PdV temporaires."
---

Les {{pdv}} mesurent ce qu'une créature peut encaisser avant de tomber. Les dégâts les font baisser, les soins et le repos les font remonter, et quand ils atteignent 0, une course contre la mort commence.

## Les PdV

Votre maximum de {{pdv}} se calcule à la création et monte avec votre Vitalité, comme le détaille le chapitre Créer un personnage. Vos {{pdv}} actuels descendent quand vous subissez des dégâts et remontent quand on vous soigne.

Ils ne dépassent jamais votre maximum et ne descendent jamais sous 0.

Une Compétence peut coûter des {{pdv}}. Au moment de la jouer, lancez ce coût et perdez autant de {{pdv}}. Cette perte n'est pas un dégât : aucune résistance ne la réduit, et rien de ce qui se déclenche sur des dégâts subis ne s'en déclenche. Elle peut vous faire tomber à 0 {{pdv}} : vous gagnez alors {{agonie}} 3 comme après toute chute, puis la Compétence se résout.

## Les dégâts

Une Compétence, une arme ou un danger qui blesse indique ses dégâts : des dés, parfois un nombre fixe, souvent les deux. Une {{attaque}} y ajoute toujours la {{caracteristique}} employée par son {{jet}}.

Des dégâts peuvent porter un type, comme les dégâts Contondants, de Feu ou d'Acide. Une arme imprime le sien, et une Compétence le nomme quand ses dégâts en portent un. Le type compte quand une créature y résiste ou y est vulnérable, ou quand une règle le nomme.

## Résistance et vulnérabilité

Une créature peut avoir une résistance ou une vulnérabilité à un type de dégâts, à une source de dégâts, ou à tous les dégâts, qu'ils portent un type ou non.

Résistance
: Elle subit la moitié des dégâts concernés, arrondie à l'inférieur.

Vulnérabilité
: Elle en subit le double.

Aucune des deux ne demande de {{jet}} : elles s'appliquent au total, une fois les dés lancés. Quand d'autres règles modifient les mêmes dégâts, procédez dans cet ordre :

1. Totalisez les dégâts avec tout ce qui les augmente ou les réduit d'un nombre fixe, comme la {{caracteristique}} d'une {{attaque}} ou « vous en subissez 1 de moins ».
2. Si la Compétence n'en inflige que la moitié, sur une réussite par exemple, divisez ce total par deux, arrondi à l'inférieur.
3. Divisez le résultat par deux en cas de résistance, ou doublez-le en cas de vulnérabilité.

Quand un même coup inflige des dégâts de plusieurs types, une résistance ou une vulnérabilité ne touche que la part de son type. Ce qui s'ajoute sans nommer de type, comme la {{caracteristique}} d'une {{attaque}}, compte avec les dégâts de l'arme ou de la Compétence. Ce qui retire un nombre fixe sans nommer de type, comme « vous en subissez 1 de moins », se retire de la part la plus forte.

Une résistance et une vulnérabilité qui touchent les mêmes dégâts s'annulent, et ces dégâts ne changent pas. Une résistance reçue de deux sources ne s'applique qu'une fois, selon le principe « Deux fois le même effet » du chapitre Comment jouer, tout comme une vulnérabilité. Deux résistances et une vulnérabilité aux mêmes dégâts s'annulent donc encore.

> [!EXAMPLE] Exemple
>
> Un coup de 10 dégâts Contondants frappe une créature qui en subit 1 de moins et qui a une résistance aux dégâts Contondants. On retire d'abord 1, puis on divise par deux : elle en subit 4, la moitié de 9 arrondie à l'inférieur. Avec une vulnérabilité à la place, elle en subirait 18.

Des dégâts réduits à 0 ne comptent pas comme des dégâts subis. Ils ne déclenchent rien de ce qui se déclenche quand on subit des dégâts, et ne font pas descendre le compteur d'{{agonie}}.

Certaines créatures échappent entièrement à un effet : un Mort-vivant ne peut pas être {{endormi}}, par exemple. Leur fiche, ou celle de l'état, le dit.

## Tomber à 0 PdV

Quand vos {{pdv}} tombent à 0, vous gagnez {{agonie}} 3 et vous commencez à mourir.

Le compteur descend de 1 à la fin de chacun de vos tours, mais pas pendant le tour où vous l'avez reçu : vous avez donc trois de vos propres tours avant la fin. Chaque action adverse qui vous inflige des dégâts vous en coûte un de plus, une fois au plus par action.

À 0, vous mourez.

Tant que dure l'{{agonie}}, vous êtes {{a-terre}} sans pouvoir vous relever, et vous ne pouvez rien jouer qui coûte de l'{{energie}} ou des {{pdv}}.

### Relever quelqu'un

Tout soin qui rend au moins 1 {{pdv}} met fin à l'{{agonie}} immédiatement. Le compteur ne se retient pas : un point rendu suffit, quelle que soit sa valeur.

Sans magie ni potion, une {{action}} et un {{jet}} réussi d'{{intelligence}} + {{medecine}} contre un {{dd}} de 20 rendent 1 {{pdv}}, ce qui met fin à l'état.

Dans les deux cas, la créature reste {{a-terre}}. Se relever lui coûte la moitié de sa {{vitesse}}, à son tour, et une créature dont la {{vitesse}} est de 0 ne peut pas se relever.

Trois tours, c'est court sans être immédiat. Un allié à terre est un problème à résoudre pendant le combat, et il le reste même si personne ne le frappe plus.

## Les soins

Un soin rend des {{pdv}}, jamais au-delà de votre maximum : ce qui dépasse est perdu. Une Compétence de soin, une potion ou un repos indiquent ce qu'ils rendent.

Entre deux combats, le repos fait le gros du travail. Le chapitre Repos et progression dit ce que rendent un {{repos-court}} et un {{repos-long}}.

## Les PdV temporaires

Certaines Compétences accordent des {{pdv}} temporaires. Ils forment une réserve à part, qui absorbe les dégâts avant vos {{pdv}} et ne compte pas dans votre maximum.

- Des {{pdv}} temporaires accordés par des effets différents s'additionnent.
- Un même effet ne se cumule pas avec lui-même : vous conservez le total le plus élevé.
- Un soin ne rend pas de {{pdv}} temporaires.
- L'effet qui les accorde indique leur durée. Ceux qui restent disparaissent à la fin de cette durée, ou à la fin d'un {{repos-court}} ou d'un {{repos-long}}, selon ce qui arrive en premier.
