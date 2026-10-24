---
title: "Concevoir une Compétence"
description: "Les champs à remplir, les étiquettes, le budget d'effet, les portées de référence et le prix en PX."
---

Une Compétence nouvelle se conçoit dans cet ordre : ce qu'elle est, ce qu'elle coûte, ce qu'elle fait, puis son prix en PX. La prose vient en dernier, sinon elle invente des mécaniques pour justifier ses phrases.

## Type et activation

Trois types existent.

Active
: Activée volontairement, elle coûte un temps d'action.

{{passif|Passive}}
: Applicable volontairement, continuellement ou automatiquement.

Spéciale
: Son propre texte définit son fonctionnement, parce qu'elle n'entre ni dans Active ni dans Passive.

L'activation dit ce qu'elle prend : une {{action}}, une {{action-bonus}}, une {{reaction}} avec son déclencheur, la place de l'une des {{attaque|Attaques}} de l'action {{ATTAQU-001}}, un temps en tours, un temps en minutes ou en heures, ou rien pour une passive.

Une Réaction énonce son déclencheur dans la première phrase de sa description, jamais dans son activation.

## Les étiquettes

Une étiquette est un levier d'équilibrage : une autre Compétence, un objet ou un état peut viser d'un coup toutes celles qui la portent. Pour chacune des trois cases, Pratique, École et Spéciale, demandez-vous si la Compétence en a besoin, pour l'équilibre, pour sa saveur ou pour une combinaison. Si la réponse est non, la case reste vide. Les Compétences de base n'en portent aucune.

Choisissez parmi les étiquettes existantes. En inventer une pour une seule Compétence ouvre une combinaison de plus dans tout le jeu sans rien apporter à la table. Une nouvelle étiquette se justifie par un manque réel, ou par une mécanique partagée entre plusieurs Arbres, comme le Cri.

Toutes les Écoles n'acceptent pas toutes les Pratiques : une Manœuvre reste dans les Écoles du combat, un Cri dans ce qu'une voix peut porter.

{{dechaine}} signale une Compétence déchaînée au sens du budget d'effet, plus bas : le joueur compose son effet au moment de la jouer.

## Le budget d'effet

Le repère de comparaison est l'Unité d'effet. C'est un outil de conception ; il n'apparaît jamais dans le texte que lit un joueur.

Une Unité d'effet vaut approximativement :

- un dé de dégâts, `1d10` sur une seule cible ;
- un dé de soin, `1d8` quand la Compétence prend une {{action}}, `1d4` quand elle prend une {{action-bonus}} ;
- un dé de {{pdv}} temporaires, `1d4` ;
- ou un effet secondaire standard.

### Le Rang

Le Rang mesure la puissance d'une Compétence active, de 1 à 9. Comme l'Unité, c'est un outil de conception, absent de tout texte que lit un joueur. Son coût en {{energie}} détermine ses Unités.

| Rang | Énergie | Unités | Zone | Limite et Karma |
| --- | --- | --- | --- | --- |
| 1 | 2 | 2 | 2d6 | |
| 2 | 3 | 3 | 4d6 | |
| 3 | 5 | 5 | 6d6 | |
| 4 | 6 | 6 | 7d6 | |
| 5 | 7 | 8 | 8d6 | |
| 6 | 9 | 10 | 11d6 | 1 fois par {{repos-long}} |
| 7 | 10 | 11 | 12d6 | 1 {{karma}}, 1 fois par {{repos-long}} |
| 8 | 11 | 12 | 13d6 | 1 {{karma}}, 1 fois par {{repos-long}} |
| 9 | 13 | 15 | 14d6 | 1 {{karma}}, 1 fois par {{repos-long}} |

La colonne Zone donne les dégâts qu'une Compétence inflige à chaque créature touchée quand elle vise plusieurs cibles ou une zone, à la place de ses Unités sur une seule cible.

Sous le Rang 1, une Compétence à 1 {{energie}} achète 1 Unité. Un coût compris entre deux Rangs compte comme le Rang du dessous, pour son bonus d'Unités, sa limite et son prix : à tout coût, les Unités valent l'{{energie}} jusqu'à 6, l'{{energie}} plus 1 de 7 à 12, et 15 pour 13. Une Compétence coûte au plus 13 {{energie|Énergies}}.

### Payer une Compétence

La ressource par défaut est l'{{energie}}. Les Compétences de base sont les seules gratuites : toute autre Compétence active paie quelque chose. Une Compétence à 0 {{energie}} paie autrement : en {{pdv}}, en {{karma}}, par une longue activation de plusieurs minutes ou heures, par une ressource qu'elle dépense, ou par une limite d'usage.

Une limite d'usage suffit à payer une Compétence qui ne coûte rien d'autre. Jouable 1 fois par {{repos-long}}, une telle Compétence va jusqu'au budget du Rang 1, 2 Unités ; jouable 1 fois par {{repos-court}}, jusqu'à 1 Unité. Une limite plus fréquente, par combat ou par tour, ne remplace pas un coût.

Au Rang 6, une Compétence paie son {{energie}} et se limite à 1 fois par {{repos-long}}. Aux Rangs 7 à 9, elle paie son {{energie}} et 1 {{karma}}, et se limite à 1 fois par {{repos-long}}. Chaque Compétence a sa propre limite : deux Compétences de Rang 6 se jouent chacune 1 fois par {{repos-long}}. Le {{karma}} pèse plus lourd que l'{{energie}} : il ne revient à aucun repos.

Aux Rangs 7 à 9, l'{{energie}} peut être remplacée en entier par 3 {{karma}}, le {{karma}} du Rang compris, ou en tout ou en partie par des {{pdv}}. Chaque {{energie}} remplacée coûte environ 2,5 {{pdv}} : payée entièrement en {{pdv}}, une Compétence de Rang 7 coûte `7d6` {{pdv}}, une de Rang 8 `8d6`, une de Rang 9 `9d6`. Dans tous les cas, la limite et le {{karma}} du Rang restent.

### Fixe ou déchaînée

Une Compétence fixe et une Compétence {{dechaine|Déchaînée}} suivent la même table : leur {{energie}} détermine leurs Unités. Une Compétence fixe dépense ses Unités quand on la conçoit, et son effet est arrêté d'avance. Une Compétence {{dechaine|Déchaînée}} laisse le joueur et le MJ les dépenser à la table. Les échanges suivants disent ce que coûte chaque choix, dans les deux cas.

| Échange | Ce qu'il coûte |
| --- | --- |
| Plusieurs cibles ou une zone, au lieu d'une cible | Les dés de la colonne Zone du même Rang |
| Une zone plus grande que celle de son Rang | 1 dé en moins par cran de 1,5 m de rayon, 3 m d'arête, 4,5 m de cône ou 9 m de ligne |
| Aucun dégât sur une {{sauvegarde}} réussie ou une {{attaque}} ratée, au lieu de la moitié | Chaque dé monte d'une taille : d10 en d12, d6 en d8 |
| Un effet secondaire | Remplace un dé de dégâts |
| Une portée au-delà de 9 m | 1 dé en moins |
| Un effet qui dure | Les mêmes dés répartis sur plusieurs tours, jamais plus |

Une Compétence qui prend « 1 {{attaque}} » garde les dégâts de cette {{attaque}}, tels que l'action {{ATTAQU-001}} les fixe : ceux de l'arme, ou `1d4` à mains nues, plus la {{caracteristique}} employée par son {{jet}}. Ses Unités s'y ajoutent. Quand elle frappe avec une arme naturelle qui remplace les mains nues, comme des sabots, des griffes ou des crocs, ses dés de dégâts comptent ce `1d4` en plus de ses Unités.

Une Compétence de Rang 3 coûte 5 {{energie|Énergies}} et achète 5 Unités : `5d10` sur une seule cible à 9 mètres ou moins, `4d10` sur une cible à 18 mètres, ou `6d6` sur chaque créature d'une zone.

## Portées et zones

Les portées de référence sont le contact à 1,5 mètre, l'allonge à 3 mètres, et la distance à 9, 12 ou 18 mètres. Une autre valeur est permise quand la Compétence la justifie. Jusqu'à 9 mètres, la portée ne coûte rien ; au-delà, elle se paie comme le dit la table des échanges.

Une zone donne sa forme et ses dimensions en multiples de 1,5 mètre. Elle grandit avec son Rang : une sphère ou un cylindre de n'importe quelle hauteur va jusqu'à 1,5 mètre de rayon par Rang, un cube jusqu'à 3 mètres d'arête par Rang, un cône jusqu'à 4,5 mètres de long par Rang et une ligne large de 1,5 mètre jusqu'à 9 mètres de long par Rang. Dans ces limites, la zone inflige les dégâts de la colonne Zone de son Rang, quelle que soit sa surface exacte ; au-delà, elle se paie comme le dit la table des échanges.

## Résister, et durer

Une Compétence à laquelle on peut résister indique le {{jet}} défensif exact de la cible, la formule exacte du {{dd}}, l'effet en cas d'échec, et l'effet en cas de réussite quand la réussite fait quelque chose. Une réussite qui ne fait qu'échapper à l'effet d'un échec ne s'écrit pas. « La cible ne subit que la moitié des dégâts » fait partie du budget, pas de la générosité.

Les dés d'un effet sur la durée suivent la table des échanges. Son texte dit quand il s'applique, combien de temps, s'il se renouvelle et s'il se cumule.

Une Compétence qui applique un état à Intensité achète les Intensités supérieures sur son budget. L'Intensité 1 doit rester comparable à ce que la fiction ordinaire produirait sans Compétence spécialisée.

## Le prix en PX

Le prix d'une Compétence active suit son Rang : 10 PX par Rang, jusqu'à 90 PX au Rang 9. Une Compétence à 1 {{energie}} coûte 5 PX, et une Compétence que seule une limite paie coûte le prix du budget qu'elle atteint : 10 PX pour 2 Unités, 5 PX pour 1. Chaque achat coûte de 5 à 100 PX, par pas de 5. Une Compétence d'Espèce vaut 25 PX par défaut.

Le prix tient compte de l'impact, de la fréquence, de l'efficacité d'action, de la souplesse, de la persistance, des synergies et des limitations. La dernière décision revient au concepteur, qui note les écarts et les surveille pendant les tests.
