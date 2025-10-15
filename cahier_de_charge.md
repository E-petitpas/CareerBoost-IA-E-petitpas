
CareerBoost E-petitpas — Cahier des charges détaillé
 
1)	Nom du projet : CareerBoost E-petitpas
🎯 Objectif principal
Faciliter et accélérer l’insertion professionnelle des jeunes diplômés, étudiants et apprenants, tout en simplifiant et modernisant le processus de recrutement pour les entreprises.
________________________________________
⚡ Objectifs spécifiques
Côté apprenants / candidats
•	Leur donner un accès centralisé aux offres d’emploi, stages et alternances.
•	Leur fournir des outils intelligents (CV IA, LM IA, matching IA) pour postuler rapidement et efficacement.
•	Leur permettre de suivre et gérer leurs candidatures de manière simple et transparente.
•	Augmenter leur taux de réussite grâce à un matching explicatif qui met en avant leurs points forts.
Côté entreprises / recruteurs
•	Réduire le temps et les efforts liés au tri des candidatures grâce au moteur de matching IA.
•	Offrir un tableau de bord RH complet pour publier, suivre et gérer les offres.
•	Permettre un recrutement plus ciblé et plus qualitatif en mettant en avant les meilleurs profils.
•	Donner une visibilité accrue à leurs offres via l’option Premium.
Côté administrateurs / financeurs
•	Garantir la qualité et la conformité des offres publiées.
•	Suivre l’impact réel en termes de candidatures et d’embauches (rapports, KPIs).
•	Contribuer à une politique d’insertion professionnelle efficace, en particulier auprès des jeunes.
👉 En résumé, le but de CareerBoost E-petitpas est de devenir un pont entre les talents et les opportunités, grâce à l’IA, afin de créer plus de rencontres pertinentes et plus d’embauches réussies.
________________________________________
2) Résumé exécutif
CareerBoost E petitpas est une application web intelligente conçue pour accélérer l’insertion professionnelle des jeunes diplômés, apprenants et étudiants tout en offrant aux entreprises un outil de recrutement moderne et efficace.
L’application combine la puissance de l’IA et une expérience utilisateur simple pour :
•	Accompagner les candidats : compléter leur profil, générer automatiquement un CV et une Lettre de Motivation avec l’IA, et postuler en un clic à des offres pertinentes. Ils bénéficient d’un suivi clair de leurs candidatures, de notifications intelligentes et d’explications transparentes sur leur score de compatibilité avec chaque offre.
•	Aider les recruteurs : publier des annonces en quelques minutes (ou les générer via IA), trier les candidatures grâce à un moteur de matching noté (0–100) avec explications, gérer un pipeline de recrutement (inviter, refuser, recruter), et télécharger directement les CV générés. L’option Premium permet de mettre en avant leurs offres pour maximiser la visibilité.
•	Outiller les administrateurs : superviser la qualité des offres (internes + externes), valider les entreprises avant publication, éviter les doublons et produire des rapports d’impact sur le taux de candidature, d’embauche et la satisfaction des utilisateurs.
L’innovation clé : un moteur de matching IA transparent qui explique en toute clarté pourquoi un candidat correspond (ou non) à une offre, permettant à la fois aux candidats et aux recruteurs de comprendre les résultats.
En résumé, CareerBoost E petitpas est bien plus qu’une plateforme d’offres d’emploi : c’est un accélérateur de carrière pour les candidats et un véritable tableau de bord RH pour les entreprises, avec un objectif commun → faciliter la rencontre entre talents et opportunités.
________________________________________
3) Périmètre MVP (v1)
•	Authentification & rôles (Apprenant / Entreprise / Admin)
•	Profil candidat + import CV + CV IA (génération CV & LM)
•	Import & agrégation d’offres (APIs officielles / flux / intégrations – TOS à respecter) + import manuel par URL/texte
•	Matching IA v1 (skills + critères durs, score & explications courtes)
•	Candidature en 1 clic (envoi email au recruteur + enregistrement du statut)
•	Suivi des candidatures (envoyé, en attente, entretien, refus, embauche)
•	Notifications automatiques d’offres pertinentes
•	Tableau de bord RH : publier offre, voir candidatures, trier par score IA, pipeline
•	Téléchargement direct des CV générés (pour recruteurs)
•	Option premium : mise en avant des offres
•	Admin : validation manuelle entreprises, supervision & déduplication, dashboard et rapports basiques
V2/V3 : messagerie in‑app, prise de RDV, parsing massif (100 CV) côté entreprise, diffusion auto multi‑plateformes avancée, scoring comportemental, etc. (voir Roadmap)
________________________________________
4) Personae & rôles
•	Apprenant / Candidat : élève, étudiant, stagiaire, jeune diplômé.
•	Entreprise / Recruteur : PME, ESN, startup, RH ou manager.
•	Administrateur : équipe E‑petitpas (contrôle qualité & conformité).
Rôles techniques : CANDIDATE, RECRUITER, ADMIN.
________________________________________
5) Parcours clés par rôle
5.1 Apprenant
1)	Onboarding & Profil : complète profil (formation, compétences, localisation, mobilités). Peut importer un CV existant ou générer automatiquement un CV IA ainsi qu’une Lettre de Motivation IA. Profil modifiable à tout moment.
2)	Flux d’offres personnalisées : découvre une liste d’offres agrégées (internes + externes), filtrées par zone géographique et préférences. Chaque carte affiche : titre, entreprise, distance, tags de compétences, Score IA 0–100 et une explication concise (par ex. « +4 compétences, manque Docker, éloigné de 20 km »).
3)	Analyse d’offres externes : peut coller une offre (texte ou lien) pour calculer un score de pertinence et recevoir une explication.
4)	Candidature en 1 clic : envoie automatiquement un mail au recruteur avec son CV/LM générés et crée une Application (statut initial = envoyé).
5)	Suivi des candidatures : suit l’évolution dans une timeline claire avec statuts : envoyé, en attente, entretien, refus, embauche. Peut ajouter des notes personnelles.
6)	Notifications intelligentes : reçoit des alertes pour nouvelles offres pertinentes (au‑delà d’un seuil configurable), changements de statut, et rappels hebdomadaires.
7)	Historique & Tableau de bord personnel : visualise ses candidatures passées, statistiques personnelles (nombre de candidatures, entretiens obtenus, taux de réponse).
5.2 Entreprise / Recruteur (Tableau de bord RH)
1)	Validation manuelle par Admin avant 1ère publication.
2)	Publier une offre (formulaire assisté + éventuelle rédaction par IA).
3)	Réception des candidatures → liste triable par Score IA ; vue détaillée (profil, CV, LM, compétences matchées/manquantes).
4)	Téléchargement direct des CV générés (PDF) ; actions pipeline : inviter en entretien, refuser, recruter.
5)	(Batch) À venir : coller une annonce et téléverser jusqu’à 100 CV → tri & recommandation (v2, voir Roadmap).
6)	Option Premium : mise en avant des offres (priorité d’affichage, badge, push ciblé).
5.3 Administrateur
1)	Dashboard simplifié : nb d’offres actives, nb de candidatures, stats d’embauche (globales & par filière) ; alertes qualité (offres expirées / dupliquées).
2)	Validation manuelle des entreprises (KYC léger + contrôles).
3)	Supervision des offres (internes + externes), déduplication (même URL/titre/entreprise → consolidation).
4)	Rapports : taux de candidature, taux d’embauche, satisfaction entreprises (NPS), performance du matching.
________________________________________
6) Matching IA v1 — Spécification
6.1 Entrées
•	Profil candidat : compétences (skills), formations, expériences, localisation (ville, rayon), disponibilités, préférences (type de contrat, rythme alternance, télétravail).
•	Offre : intitulé, entreprise, compétences requises (obligatoires / souhaitées), critères durs (type de contrat, localisation), niveau d’expérience, salaire (si fourni).
6.2 Logique
1)	Filtres durs (éliminatoires) :
o	Type de contrat incompatible (ex. CDI requis / candidat refuse CDI) → score = 0.
o	Localisation : si distance > rayon accepté → malus fort (jusqu’à 0 si bloquant).
2)	Similarité de compétences (pondérée) :
o	Encoder compétences (offre & candidat) via OpenAI Embeddings ou équivalent ; calculer similarité cosinus.
o	Pondérer : obligatoires > souhaitées ; compétences récentes > anciennes.
3)	Autres signaux (bonus/malus) : niveau d’expérience, correspondance secteur, mots‑clés titre, contraintes légales (permis, habilitations), langue.
4)	Score 0–100 : score = clamp( round(100 * (alpha*skills + beta*experience + gamma*autres) * hard_filters_multiplier) ).
5)	Explication courte (1–2 phrases) générée par IA (prompt structuré) listant : nb compétences matchées / manquantes, contrainte localisation & distance, écart d’expérience.
Exemple d’explication : > « Score 72 : vous correspondez sur 4 compétences, mais il manque Docker et vous êtes éloigné de 20 km. »
6.3 Pseudo‑code
if !hard_contract_match or distance_km > candidate.radius_km_max:
    return (0, "Critère dur non respecté : contrat/localisation")

skills_sim = cosine_sim(emb(cand.skills), emb(job.req_skills))
exp_align  = level_match(cand.experience, job.experience_min)
bonus      = keyword_boost(cand, job)

raw = alpha*skills_sim + beta*exp_align + gamma*bonus
score = round(100 * raw)
explain = gen_explanation(cand, job, score, missing_skills, distance_km)
return (clamp(score,0,100), explain)
Traçabilité : stocker détails du score (skilles matchées, manquantes, distance, filtres appliqués) pour audit et transparence.
________________________________________
7) Fonctionnalités — Détails & critères d’acceptation
7.1 Apprenant — capacités détaillées
7.1.1 Onboarding & profil
•	Création profil guidée (étapes) : identité, titre visé, formation(s), expériences, compétences (tags), localisation + rayon de mobilité (km), préférences (contrat, télétravail, rythme alternance), langues, prétentions salariales (optionnel).
•	Import LinkedIn (optionnel v2) : pré‑remplit le profil.
•	CV existant : upload PDF/Doc → extrait compétences & expériences (pré‑remplissage, confirmation par l’utilisateur).
•	AC : tous les champs obligatoires sont validés ; possibilité de sauvegarde partielle et reprise.
•	Erreurs/edge cases : fichier CV illisible → message clair + recommandations de format ; compétences dupliquées fusionnées.
7.1.2 CV IA & LM IA
•	Génération : à partir du profil, l’utilisateur peut générer un CV et une Lettre de Motivation (modèles sobres). Choix du style (académique, alternance, junior tech…).
•	Édition : l’utilisateur peut modifier le texte généré avant export.
•	Export : PDF téléchargeable + version éditable conservée.
•	Historique des versions : conserver les 5 dernières avec date.
•	AC : génération < 30 s, textes sans fautes majeures (vérif orthographique), données personnelles bien placées.
•	Erreurs : dépassement longueur → résumé automatique ; champs manquants → demande de compléter.
7.1.3 Découverte d’offres (feed IA)
•	Flux personnalisé : agrégation d’offres (internes + externes autorisées) filtrées par zone et préférences ; rafraîchissement quotidien.
•	Carte offre : titre, entreprise, ville/distance, tags de compétences, Score IA 0–100, explication courte (2 phrases), date de publication, source.
•	Filtres & tri : distance, type de contrat, télétravail, salaire (si dispo), score décroissant/nouveautés.
•	Favoris : sauvegarder des offres ; listes (ex. « Alternance Dev »).
•	AC : temps de chargement < 1,5 s pour 20 cartes ; score et explication visibles sans ouvrir la fiche.
7.1.4 Détails d’une offre
•	Fiche : description, exigences (obligatoires/souhaitées), avantages, contact, source originale (lien), compétences matchées vs manquantes, distance.
•	Actions : Candidature en 1 clic, Enregistrer, Partager, Signaler (contenu obsolète/abusif).
•	AC : clarté des sections ; signalement enregistré côté admin.
7.1.5 Évaluer une offre copiée (parse)
•	Coller un lien ou coller du texte d’annonce → parsing → score + explication immédiats ; possibilité de candidater si contact présent ou d’enregistrer la fiche pour suivi manuel.
•	AC : si parsing partiel, afficher ce qui a été compris + champs à compléter.
7.1.6 Candidature en 1 clic
•	Comportement : un clic → envoie e‑mail au recruteur (CV + LM en PJ, ou lien de téléchargement sécurisé) + crée Application avec statut envoyé.
•	Personnalisation rapide : avant l’envoi, le candidat peut tuner l’accroche (200 caractères) et choisir la version de CV/LM.
•	Preuve : accusé d’envoi (horodaté) stocké dans l’Application.
•	AC : bouton désactivé si champs essentiels manquants ; double‑clic protégé (idempotence) ; message succès/échec explicite.
7.1.7 Suivi des candidatures (pipeline candidat)
•	Timeline : envoyé → en attente → entretien → refus → embauche.
•	Mises à jour : automatiques si le recruteur agit via la plateforme ; manuelles par le candidat (avec justificatif optionnel).
•	Notes perso : le candidat peut ajouter une note (préparation d’entretien, retours).
•	Relances : rappel intelligent (ex. 7 jours après « en attente ») avec modèle de mail de relance.
•	AC : toutes les transitions sont historisées (qui/quand) ; export CSV de ses candidatures.
7.1.8 Notifications & préférences
•	Types : nouvelles offres pertinentes (≥ seuil score), changements de statut, rappels relance, recommandations de complétion de profil.
•	Canaux : in‑app, e‑mail (SMS v2).
•	Centre de préférences : activer/désactiver par type ; régler seuil de score.
•	AC : pas plus de 1 e‑mail/jour pour offres (anti‑spam), regroupement possible (digest).
7.1.9 Accessibilité, langues & confidentialité
•	Accessibilité : contrastes AA, navigation clavier, textes descriptifs.
•	Langues : FR (v1), EN (v2) ; formats date/lieu adaptés.
•	Confidentialité : visibilité du profil (publique aux recruteurs validés / privée) ; téléchargement de ses données ; suppression de compte (RGPD) avec purge des documents.
7.1.10 Analytics (côté candidat)
•	Événements : profile_completed, cv_generated, offer_view, apply_click, application_status_change, notification_open.
•	KPIs personnels : nb candidatures, taux de réponse, temps médian jusqu’à entretien.
7.1.11 Critères d’acceptation récapitulés
•	L’apprenant peut :
1)	Créer/éditer son profil, générer CV & LM ;
2)	Voir un flux d’offres avec score + explication ;
3)	Candidater en 1 clic (e‑mail envoyé, application créée) ;
4)	Suivre ses candidatures avec timeline et notes ;
5)	Recevoir des notifications et régler ses préférences ;
6)	Coller une annonce externe pour évaluer le score ;
7)	Exporter ses candidatures et gérer sa confidentialité.
7.2 Entreprise / Recruteur — capacités détaillées
7.2.1 Onboarding & validation
•	Inscription entreprise : saisie nom, SIREN, domaine e mail pro, logo, secteur, taille.
•	Validation manuelle admin avant publication (KYC léger).
•	Profils recruteurs multiples par entreprise (Rôle: ADMIN_RH, RH_USER).
7.2.2 Gestion des offres
•	Publier une offre : formulaire assisté (intitulé, missions, compétences obligatoires/souhaitées, localisation, salaire, contrat).
•	Rédaction IA (option) : propose un texte clair à partir de mots clés.
•	Éditer / archiver une offre.
•	Option Premium : marquer offre comme premium (badge + mise en avant).
•	AC : offre publiée visible côté candidats après validation admin ; formulaire ergonomique (sections distinctes).
7.2.3 Réception & traitement des candidatures
•	Tableau de bord RH : liste des candidatures reçues (par offre ou global).
•	Tri / filtrage : par Score IA, compétences matchées/manquantes, expérience, distance.
•	Vue détaillée : CV/LM générés, profil complet candidat, explication matching.
•	Téléchargement direct : CV/LM PDF depuis la candidature.
•	Pipeline : boutons Inviter entretien / Refuser / Recruter.
•	AC : action pipeline met à jour statut côté candidat + envoi e mail ; tout historisé.
7.2.4 Recherche proactive & parsing (future v2)
•	Coller une annonce externe → système propose correspondances dans la base.
•	Upload massif (jusqu’à 100 CV) pour scoring automatique (hors MVP, v2).
•	Suggestions IA : propose d’autres profils pertinents de la base interne.
7.2.5 Communication
•	E mails automatiques : générés par l’action pipeline (invitation/refus/recrutement).
•	Messagerie in app (v2) : chat direct si candidat a un compte.
•	Notifications : reçues en cas de nouvelles candidatures.
7.2.6 Analytique & reporting RH
•	KPIs entreprise : nb d’offres publiées, nb candidatures reçues, taux de conversion (candidatures→entretiens→embauches).
•	Comparaison : perf d’une offre premium vs non premium.
•	Export CSV : toutes candidatures, statuts, scores.
7.2.7 Critères d’acceptation récapitulés
•	L’entreprise/recruteur peut :
1.	S’inscrire et être validée ;
2.	Publier/éditer/archiver des offres ;
3.	Recevoir candidatures, trier par score IA, voir CV/LM générés ;
4.	Télécharger les documents ;
5.	Gérer candidatures via pipeline (inviter, refuser, recruter) avec e mails automatiques ;
6.	Activer option premium ;
7.	Consulter des statistiques RH et exporter.
7.3 Administrateur — capacités détaillées
7.3.1 Onboarding & gestion des entreprises
•	Validation manuelle des entreprises inscrites : vérification SIREN, domaine e mail pro, cohérence secteur.
•	Workflow : statut PENDING → APPROVED ou REJECTED.
•	Actions : suspension ou suppression de compte entreprise en cas d’abus.
•	AC : une offre ne peut pas être publiée si l’entreprise n’est pas validée.
7.3.2 Supervision des offres
•	Contrôle qualité : repérer les offres expirées, doublons, annonces non conformes.
•	Déduplication : fusionner ou masquer les offres identiques (même URL, titre + entreprise + ville).
•	Validation manuelle d’offres signalées par des candidats.
•	AC : tableau d’offres avec filtres (expirées, suspectes, signalées).
7.3.3 Dashboard & monitoring
•	Tableau de bord simplifié avec KPIs clés :
o	Nb d’offres actives
o	Nb de candidatures créées
o	Nb d’embauches confirmées
o	Nb d’entreprises validées
o	Répartition par secteur / localisation
•	Alertes : anomalies (trop d’offres dupliquées, taux de refus anormal).
•	Logs : actions admin historisées (audit trail).
7.3.4 Rapports & analytique
•	Rapports périodiques (export PDF/CSV) :
o	Taux de candidature (offres vues → candidatures)
o	Taux d’embauche (candidatures → embauches)
o	Délai moyen (candidature → entretien → embauche)
o	Satisfaction entreprises (via enquêtes NPS)
•	Utilité : transmettre aux financeurs (OPCO, Région, État) comme preuve d’impact.
7.3.5 Gestion des utilisateurs & support
•	Recherche utilisateur (candidat ou recruteur) et consultation de son profil.
•	Blocage/désactivation d’un compte en cas d’abus.
•	Réinitialisation mot de passe sur demande.
•	Support : gestion des tickets signalés (problèmes techniques, abus, offres frauduleuses).
7.3.6 Sécurité & conformité
•	RGPD : droit à l’oubli, suppression de compte + purge des données associées.
•	Audit régulier des logs, suivi des accès sensibles.
•	Paramétrages globaux : seuil score IA par défaut, durée conservation données, fréquence notifications.
7.3.7 Critères d’acceptation récapitulés
•	L’administrateur peut :
1.	Valider / rejeter / suspendre des entreprises.
2.	Superviser les offres (qualité, déduplication, signalement).
3.	Accéder à un dashboard avec KPIs clés + alertes.
4.	Générer des rapports périodiques (CSV/PDF).
5.	Gérer les comptes utilisateurs (bloquer, réinitialiser, supprimer).
6.	Gérer la conformité (RGPD, logs, paramètres globaux).
________________________________________
8) Modèle de données (simplifié)
User {id, role[CANDIDATE|RECRUITER|ADMIN], name, email, phone, password_hash, verified, company_id?, location{lat,lng,city}, created_at}
Company {id, name, siren?, domain, status[PENDING|VERIFIED|REJECTED], created_at}
CandidateProfile {user_id, title, summary, skills[tag[]], experience_years, education[], mobility_km, preferred_contracts[], cv_url?, lm_url?, updated_at}
JobOffer {id, company_id, title, description, location{lat,lng,city}, contract_type, required_skills[tag[]], optional_skills[tag[]], experience_min, salary_min?, salary_max?, source[INTERNAL|EXTERNAL], source_url?, status[ACTIVE|ARCHIVED|EXPIRED], premium_until?}
Application {id, offer_id, candidate_id, status[ENVOYE|EN_ATTENTE|ENTRETIEN|REFUS|EMBAUCHE], score, explanation, cv_snapshot_url, lm_snapshot_url, created_at, updated_at}
Notification {id, user_id, type, payload, read_at?, created_at}
MatchTrace {application_id?, offer_id, candidate_id, inputs_hash, score, matched_skills[], missing_skills[], distance_km, hard_filters, explanation, created_at}
________________________________________
9) APIs (REST, exemples)
Auth
•	POST /auth/register (role)
•	POST /auth/login
Candidat
•	GET /me/profile / PUT /me/profile
•	POST /me/cv/generate (CV IA) → {pdf_url}
•	POST /me/lm/generate (LM IA) → {pdf_url}
•	GET /offers?near=argenteuil&radius=25&minScore=60
•	POST /offers/:id/apply → envoie email + crée Application
•	POST /offer/parse (coller lien/texte) → {parsed_offer, score, explanation}
•	GET /applications / PATCH /applications/:id (mise à jour statut si autorisé)
Recruteur
•	POST /companies/:id/verify (admin only)
•	POST /offers / PUT /offers/:id / PATCH /offers/:id/premium
•	GET /offers/:id/applications?sort=score_desc
•	POST /applications/:id/action {action: INVITE|REFUSE|RECRUIT}
•	GET /applications/:id/cv (télécharger PDF)
•	(v2) POST /offers/:id/bulk-cv (upload 100 CV) → {ranking}
Admin
•	GET /admin/dashboard (counts & KPIs)
•	POST /admin/companies/:id/approve (validation manuelle)
•	GET /admin/offers?duplicates=true → fusion/suppression
•	GET /admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
Emails via provider (ex. SMTP/API) ; file store (S3 compatible) pour CV/LM.
________________________________________
10) Intégrations Offres & Conformité
•	Sources : Pôle Emploi, APEC, Indeed, LinkedIn Jobs (selon TOS & API). Prioriser APIs officielles ou flux autorisés.
•	Déduplication : clé = (titre_normalisé, entreprise, ville) + hachage contenu + URL canonique.
•	Respect RGPD : consentement, finalités, durée de conservation, droit d’effacement ; chiffrement des données sensibles au repos & en transit ; audit admin.
________________________________________
11) Notifications
•	Déclencheurs :
o	Nouvelle offre ≥ minScore (profil candidat)
o	Changement de statut d’une candidature
o	Rappels hebdomadaires : « 10 nouvelles offres pertinentes »
•	Canaux : in‑app, e‑mail ; (SMS push optionnel v2)
•	Préférences : centre de préférences par utilisateur.
________________________________________
12) Sécurité & Qualité
•	Validation emails (DKIM/SPF pour délivrabilité)
•	Anti‑spam (throttling candidatures, honeypots)
•	Logs & Audit trail (actions admin/recruteur)
•	RBAC strict (séparation des données entreprise)
•	Tests unitaires + intégration + E2E (candidature 1 clic, tri IA, pipeline)
________________________________________
13) UX/UI — éléments clés
•	Candidat :
o	Carte offre : titre, entreprise, distance, tags, Score IA (badge), explication courte.
o	Bouton « Candidature 1 clic » + menu « Voir détails ».
o	Timeline de candidature (statuts colorés : envoyé, en attente, entretien, refus, embauche).
•	Recruteur :
o	Tableau « Candidatures » avec tri par score, filtres.
o	Actions pipeline en ligne (inviter / refuser / recruter).
o	Badge Premium sur offres, top listing.
•	Admin :
o	KPIs en tuiles : offres actives, candidatures, embauches.
o	Files d’attente : entreprises à valider, offres à contrôler.
________________________________________
14) KPIs & Rapports
•	Taux de candidature (offres vues → candidatures)
•	Taux d’embauche (candidatures → embauches)
•	Temps médian : inscription → 1ère candidature ; candidature → entretien ; entretien → embauche
•	CTR par tranche de score (qualité du matching)
•	Satisfaction entreprises (NPS), taux de rétention recruteurs
________________________________________
15) Roadmap (proposée, détaillée)
Phase 1 — MVP 
•	Objectifs : livrer un parcours complet Candidat → Recruteur → Admin avec matching IA v1.
•	Fonctionnalités incluses :
o	Création profil + génération CV/LM IA.
o	Agrégation d’offres (source interne + API simple).
o	Matching IA v1 (compétences + critères durs) + explication courte.
o	Candidature 1 clic (e mail + enregistrement statut).
o	Suivi des candidatures (pipeline côté candidat).
o	Notifications basiques (offres pertinentes, statut candidature).
o	Recruteur : publier offre, recevoir candidatures, tri par score IA, pipeline (inviter/refuser/recruter).
o	Téléchargement CV/LM générés.
o	Option Premium (badge + mise en avant simple).
o	Admin : validation entreprises, supervision offres, dashboard basique (compteurs), rapports simples.
•	Livrables : MVP stable en prod + démo complète.
Phase 2 — Fonctionnalités avancées 
•	Candidat : messagerie in app avec recruteurs, prise de RDV, import LinkedIn, export candidatures CSV.
•	Recruteur : parsing massif (jusqu’à 100 CV), suggestions IA de profils alternatifs, export complet CSV, comparaison offres premium vs classiques.
•	Admin : rapports avancés (taux de conversion détaillé, délai moyen, NPS entreprises), gestion avancée des signalements, alertes automatiques (taux de refus anormal, doublons).
•	Technique : amélioration performance IA (cache embeddings), tests de charge, sécurisation avancée (audits, monitoring).
•	Livrables : version v2 en production avec fonctionnalités RH étendues.
Phase 3 — Écosystème & scale 
•	Candidat : recommandations proactives (emplois suggérés automatiquement chaque semaine), tableau de bord personnel (taux de réponse, progression insertion).
•	Recruteur : diffusion multi plateformes automatisée (Indeed, LinkedIn Jobs, etc.), paiement en ligne pour option Premium, reporting comparatif multi campagnes.
•	Admin : suivi global insertion (taux emploi par filière, rapport d’impact OPCO/Région/État), gestion des paiements Premium.
•	IA : score d’employabilité, matching contextuel (soft skills, style de rédaction), analyse tendances du marché.
•	Technique : scalabilité (multi région, CDN, observabilité complète), API publique pour partenaires.
•	Livrables : plateforme robuste et reconnue, capable de gérer plusieurs milliers d’utilisateurs et d’offres.

