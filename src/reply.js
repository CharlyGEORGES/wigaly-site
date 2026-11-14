/* ---------- La réponse de la machine : des règles, zéro IA ----------
   reply(texte, max) dit ce que devient l'élément posé, en max caractères au plus.
   Dans l'ordre : les sujets qu'on laisse aux humains, les formes reconnaissables (calcul, adresse, montant, date),
   les mots de la conversation, les familles de travail, le quotidien, les questions, les verbes.
   À défaut, la réponse se construit avec les mots reçus. Même entrée, même sortie : c'est une machine. */
var reply=(function(){
  function norm(s){s=s.toLowerCase();if(s.normalize)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');return s.replace(/[’`´]/g,"'").replace(/œ/g,'oe').replace(/æ/g,'ae');}
  function hash(s){var h=2166136261,i;for(i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h+((h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24)))>>>0;}return h;}
  function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
  function bare(t){return t.replace(/^[«"'“(]+|[»"'”),.;:!?…]+$/g,'');}
  function clip(s,k){
    if(s.length<=k)return s;
    var c=s.slice(0,Math.max(1,k-1)),l=c.charCodeAt(c.length-1);
    if(l>=0xD800&&l<=0xDBFF)c=c.slice(0,-1);
    return c.replace(/[\s,;:.'’«-]+$/,'')+'…';
  }
  function choose(list,seed,max){var ok=[],i;for(i=0;i<list.length;i++)if(list[i]&&list[i].length<=max)ok.push(list[i]);return ok.length?ok[seed%ok.length]:null;}
  function typo(s){return s.replace(/ ([:;?!»])/g,'\u00a0$1').replace(/« /g,'«\u00a0');}
  function fr(v){var r=Math.round(v*100)/100,p=String(Math.abs(r)).split('.');return (r<0?'-':'')+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'\u00a0')+(p[1]?','+p[1]:'');}

  /* Les tables et leurs expressions ne se construisent qu'à la première demande : rien ne pèse sur le chargement */
  function build(){
    var MOIS={janvier:'de janvier',fevrier:'de février',mars:'de mars',avril:'d’avril',mai:'de mai',juin:'de juin',juillet:'de juillet',aout:'d’août',septembre:'de septembre',octobre:'d’octobre',novembre:'de novembre',decembre:'de décembre'};
    var MOIS_RE='janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre',JOURS_RE='lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche';
    var TEMPS=new RegExp('^(?:'+MOIS_RE+'|'+JOURS_RE+')$');
    var OUTIL=/^(?:a|au|aux|avec|ce|ces|cet|cette|chez|d|dans|de|des|du|en|et|l|la|le|les|leur|leurs|ma|mes|mon|ne|nos|notre|ou|par|pas|pour|qu|que|qui|sa|sans|se|ses|son|sur|ta|tes|ton|un|une|vos|votre|y|je|tu|il|elle|on|nous|vous|ils|elles|est|sont|ai|as|ont|suis|es|etre|avoir|c|ca|cela|j|m|n|s|t|tres|trop|plus|moins|bien|mal|tout|tous|toute|toutes|the|of|and|to|for|my|is|it|faut|fait|vraiment|encore|aussi|mais|donc|car|si|comme|quand|alors|cest|jai|ete|sera|etait|peu|you|are|not|ici|la)$/;
    var BANAL=/^(?:pdf|cv|ia|ok|si|crm|erp|kpi|rgpd|tva|csv|xlsx?|sms|rdv|cdi|cdd|ht|ttc|asap|urgente?s?|svp|stp|bis|rh|sav|faq|v\d+)$/;
    var NOM=/^[A-ZÀ-Ý][A-Za-zà-ÿ'’-]{2,}$/;

    /* Les sujets qu'une machine à blagues ne touche pas */
    var GRAVE=/\b(?:morte?s?|deces|decede\w*|deuil|suicid\w*|cancer\w*|malad\w*|accident\w*|licenci\w*|burn-?out|depress\w*|divorc\w*|viol|viols|violer|violeurs?|violences?|agress\w*|harcel\w*|attentats?|terroris\w*|meurtres?|tuer|guerres?|handicap\w*|chomage|faillites?|expuls\w*|inceste|pedo\w*|avortement|drogues?|cannabis|cocaine|heroine|enterrement|obseques|funerailles|euthanasie|demission\w*|rupture conventionnelle|armes?|fusils?|pistolets?|bombes?|explosifs?)\b/;
    var GENS=/\b(?:juifs?|juives?|musulman\w*|chretien\w*|catholiques?|arabes?|africain\w*|asiatiques?|immigr\w*|migrants?|refugie\w*|racis\w*|antisemit\w*|homophob\w*|sexis\w*|homosexuel\w*|gays?|lesbienn\w*|transgenres?|nazi\w*|hitler|genocide|esclav\w*|gitans?|femmes?|hommes?|maris?|epouses?|enfants?|bebes?|fils|filles?|peres?|meres?|papas?|mamans?|freres?|soeurs?|amie?s?|copains?|copines?|voisine?s?|gens|humains?|personnes?|famille|belle-?mere|beau-?pere|tante|oncle|cousine?s?|grand-?mere|grand-?pere|mamie|papy|papi)\b|^(?:moi|toi|lui|elle|eux|elles|nous|vous|nous tous|tout le monde)$/;
    var CREDO=/\b(?:politi\w*|election\w*|gouvernement|ministres?|deputes?|senat\w*|macron|le ?pen|melenchon|zemmour|bardella|trump|biden|poutine|syndicats?|greves?|manifs?|manifestations?|religi\w*|dieux?|allah|jesus|bible|coran|eglises?|mosquees?|synagogues?|pape|islam\w*|judaism\w*|christianism\w*|bouddh\w*|athee?s?)\b/;
    var GROS=/\b(?:merde\w*|putain|bordel|chier|chiante?s?|con|conne|connard\w*|connasse\w*|encul\w*|salope\w*|putes?|batard\w*|ntm|fdp|fuck\w*|shit\w*|bullshit|wtf|zut|flute|punaise|mince|crotte|caca|pipi|prout|bites?|couill\w*|culs?|sexe|sexy|sexuel\w*|porn\w*|xxx|baise\w*|penis|vagin)\b/;

    /* Conversation, clins d'œil, maison. « ~ » reprend le mot reconnu ; le 1 final fait passer la règle après les familles dès que le texte dépasse deux mots. */
    var DIRE=[
      [/^(bonjour|bonsoir|salut|coucou|hello)\b/,'~ à vous aussi',1],
      [/^(?:bjr|slt|cc|hi|hey|yo|wesh|bonne journee|bonne soiree)\b/,'Bonjour à vous aussi',1],
      [/\b(?:merci|thanks|thank you|thx)\b/,'De rien, c’est mécanique|Avec plaisir',1],
      [/\b(?:au revoir|bye|ciao|a plus|a bientot|bonne nuit|tchao|adieu)\b/,'À bientôt, alors',1],
      [/^(?:oui|ouais|yes|yep|ok|okay|dacc|ca marche|go|banco|top|parfait|super|genial|bravo)$|^d'accord\b/,'Accord noté, tracé'],
      [/^(?:non|no|nope|nan|jamais|surtout pas)$/,'Refus noté, sans rancune|Refus noté, tracé'],
      [/^(?:peut-etre|bof|mouais|je ne sais pas|je sais pas|jsp|aucune idee|sais pas)\b/,'Besoin à cadrer en 30 min|Décision à cadrer'],
      [/n'? ?importe quoi|^(?:nimp|nawak)$/,'Quelque chose, enfin'],
      [/\b(?:petits? trucs?|vite fait)\b/,'Appli en prod'],
      [/\b(?:trucs?|machins?|bidules?|choses?|qqch|qqchose|schmilblick)\b/,'Un truc, mais rangé'],
      [/\bessais?\b/,'Essai transformé'],
      [/\b(?:lorem|ipsum)\b/,'Vrai texte demandé'],
      [/\b(?:tests?|toto|tata|titi|tutu|foo|foobar|blabla|bla|demo|exemple|example)\b/,'Test concluant|Test réussi, tracé'],
      [/\b(?:rien|nada|que dalle|vide|neant)\b/,'Rien à faire. Parfait.'],
      [/^(?:tout|tous|toutes|everything|la totale)$/,'Tout ? Par lots, alors.'],
      [/\b(?:aide|help|sos|au secours|helpdesk)\b|a l'aide/,'Ticket créé, on arrive'],
      [/\b(?:blagues?|humour|jokes?|rigol\w*|drole)\b/,'Toc toc. C’est rangé.'],
      [/\b(?:a?ha(?:ha)+h?|hihi\w*|hehe\w*|lol|mdr|ptdr|xd|xptdr)\b/,'Humour détecté, classé'],
      [/^(?:ca va|comment ca va|comment vas-tu|comment allez-vous|ca roule|la forme|quoi de neuf)\b/,'Très bien, ça tourne'],
      [/qui es[- ]tu|t'es qui|tu es qui|ton nom|tu t'appelles|who are you|qui etes[- ]vous|c'est quoi cette machine/,'W-01, enchantée'],
      [/\b(?:je t'aime|je vous aime|amour|love|bisous?|bises?|coeurs?|calins?)\b/,'Sentiment bien reçu'],
      [/\b(?:wigaly|w-?01)\b/,'Déjà au bon endroit'],
      [/\b(?:pme|tpe|eti|grands? comptes?|startups?|artisans?|commercants?|independants?|associations?)\b/,'Bienvenue, on s’adapte'],
      [/^combien\b/,'Chiffrage en cours'],
      [/\b(?:magie|magique|miracles?|abracadabra)\b/,'Pas de magie : des règles|Des règles, zéro magie'],
      [/\b(?:secrets?|confidentiel\w*|prive\w*)\b/,'Rien ne sort d’ici'],
      [/\bia\b.*\bdecid/,'Non, elle prépare'],
      [/\b(?:ia|intelligence artificielle|chatgpt|gpt|copilot|gemini|llm|robots?|agents? ia|machine learning|algorithmes?)\b/,'Placée où elle sert|Utile, jamais décideuse'],
      [/\b(?:power ?apps?|power ?automate|power ?platform|dataverse|sharepoint|microsoft|azure|dynamics|m365|o365|copilot studio|low-?code|no-?code)\b/,'Notre terrain de jeu|Huit ans qu’on pratique'],
      [/\b(?:coder|devs?|developpeu\w*|developpement|python|javascript|typescript|react|api|sql|github|git|scripts?)\b|\bcode\b(?! (?:postal|barre|promo|pin|secret|couleur|naf|ape))/,'Code sur mesure, testé|Le bon outil, bien placé'],
      [/\b(?:airbnb|booking|gites?|logements?|voyageurs?|conciergerie|locations? saisonnieres?)\b/,'Boîtier Wigaly posé'],
      [/\b(?:3d|bobines?|filaments?|pla|petg|bambu\w*|makers?)\b/,'Stock de bobines à jour|Bobines comptées'],
      [/\b(?:musiques?|playlists?|chansons?|soirees?|karaoke|jukebox|dj|spotify|deezer)\b/,'Ajouté à la Jukebox']
    ];

    /* Les familles de travail. « % » accueille une précision trouvée dans le texte (nom, mois, jour, numéro), « @ » un nom seulement. */
    var FAM=[
      ['notes? de frais|tickets? de caisse|justificatifs?','Remboursement validé|Note de frais contrôlée'],
      ['bons? de commande|commandes?|orders?|paniers?','Commande expédiée|Commande suivie, livrée|Commande dans l’ERP|Commande % suivie'],
      ['factur\\w*|invoices?','Écriture compta prête|Facture lettrée, classée|Écriture % prête|Facture % rapprochée'],
      ['devis|chiffrages?|estimations?|quotes?|propales?|propositions? commerciales?','Devis chiffré, envoyé|Devis relancé, signé|Devis % signé'],
      ['livraisons?|colis|expeditions?|transporteurs?','Livraison tracée|Colis suivi à la trace|Suivi de livraison actif|Livraison % tracée'],
      ['stocks?|inventaires?|entrepots?','Stock à jour|Stock à jour, seuil posé|Inventaire sans ressaisie'],
      ['reunions?|meetings?|visios?|comites?|points? hebdo|ateliers?|copil|codir|comex|brief\\w*|seminaires?|comptes? rendus?','Compte rendu prêt|Compte rendu, 3 lignes|Actions listées, datées|Compte rendu %'],
      ['macros?|vba','Flow Power Automate|Macro remplacée, testée'],
      ['excel|xlsx?|tableurs?|csv|onglets?|google sheets?|tableaux? croises?','Un tableau de bord|Une seule version|Données fiables, enfin'],
      ['e-?mails?|mails?|courriels?|messages?|sms|inbox|boites? de reception|newsletters?','Réponse à valider|Mail trié, résumé|Brouillon prêt à relire|Réponse à @ prête'],
      ['contrats?|avenants?|baux|bail|cgv|nda|clauses?|juridiques?','Échéances surveillées|Clauses à risque listées|Contrat % relu|Contrat % : clauses OK'],
      ['pdf|scans?|documents?|fichiers?|word|docx?|courriers?|lettres?|pieces? jointes?','Champs extraits|Document classé, indexé'],
      ['dossiers?|classeurs?|archives?|paperasse|papiers?','Archive retrouvable|Dossier complet, indexé'],
      ['reclamations?|plaintes?|litiges?|mecontent\\w*|insatisfait\\w*','Réclamation suivie|Réclamation qualifiée'],
      ['tickets?|bugs?|incidents?|pannes?|support|sav','Workflow lancé|Ticket qualifié, assigné|Ticket % assigné'],
      ['post-?its?|pense-betes?|rappels?|to-?do|taches?|listes?','Rappel Teams|Tâche assignée, datée'],
      ['urgen\\w*|asap|vite|deadlines?|echeances?|pour hier|retards?','Priorité vérifiée|Priorité : basse|Échéance tenue'],
      ['cv|candidat\\w*|recrut\\w*|embauch\\w*|entretiens?','Profil résumé|Entretien planifié|Profil @ résumé'],
      ['conges?|vacances|rtt|absences?|arrets? de travail','Absence planifiée|Congés posés, validés'],
      ['plannings?|agendas?|calendriers?|rdv|rendez-vous|rendez vous|creneaux?|horaires?','Planning à jour|Créneaux sans conflit'],
      ['relanc\\w*|impayes?','Relance planifiée|Relance envoyée, payée|Paiement reçu|Relance % envoyée'],
      ['clients?|clientes?|prospects?|leads?|crm|commercia\\w*|ventes?','Fiche client à jour|Relance planifiée|Opportunité qualifiée|Fiche @ à jour'],
      ['fournisseurs?|achats?|appels? d\'offres?|sous-traitants?','Fournisseur référencé|Commande d’achat validée'],
      ['paiements?|virements?|reglements?|encaissements?|rib|iban','Paiement rapproché|Paiement reçu'],
      ['budgets?|previsionnel\\w*|compta\\w*|bilans?|tresorerie|clotures?','Trésorerie projetée|Écart expliqué, chiffré|Clôture sans nuit blanche'],
      ['cookies?|traceurs?|pisteurs?','Aucun cookie ici|Aucun cookie ici, promis|Zéro cookie, zéro traceur'],
      ['donnees perso\\w*|vie privee|cnil|rgpd|consentements?|dpo','Registre RGPD à jour'],
      ['rapports?|reporting|kpi|indicateurs?|tableaux? de bord|dashboards?|stats?|statistiques?|chiffres|donnees|data|power ?bi|bases? de donnees','Rapport Power BI|Indicateurs à jour|Chiffres fiables, datés|Rapport % généré'],
      ['presentations?|powerpoint|pptx?|slides?|diapos?','Dix diapos de moins|Diapos à jour, sourcées'],
      ['formulaires?|questionnaires?|sondages?|enquetes?|inscriptions?','Dossier créé|Réponses consolidées'],
      ['signatures?|parapheurs?|validations?|approbations?|feu vert|bon pour accord','Circuit de validation|Signé, tracé, archivé'],
      ['offboarding|departs?','Accès retirés, tracés'],
      ['onboarding|arrivees?|nouvel arrivant|integration|stagiaires?|alternants?|apprentis?','Accès créés, PC prêt'],
      ['acces|droits?|habilitations?|comptes?|licences?','Droits vérifiés|Droits vérifiés, tracés'],
      ['audits?|controles?|conformite|rgpd|securite|iso ?\\d*','Journal d’audit prêt|Preuves réunies, datées'],
      ['process|processus|procedures?|workflows?|circuits?|etapes?','Étapes mesurées|Étapes tracées, mesurées|Processus sans ressaisie'],
      ['saisies?|ressaisies?|copier-?coller|doubles? saisies?','Zéro ressaisie|Copier-coller supprimé'],
      ['photos?|images?|captures?|screenshots?','Texte extrait, indexé'],
      ['videos?|audios?|vocal|vocaux|enregistrements?|podcasts?','Transcrit et résumé'],
      ['appels?|telephone|coups? de fil|standard','Appel consigné au CRM'],
      ['sites?(?: web| internet| vitrine)?|pages? web|landing pages?','Site en ligne, mesuré'],
      ['portails?|intranet|extranet|applis?|applications?|apps?|logiciels?|outils?|erp|sap|salesforce','Appli en prod|Branché sur votre SI|Portail en libre-service'],
      ['questions?|faq|demandes?|requetes?','Demande routée|Demande qualifiée, routée|Réponse trouvée, sourcée'],
      ['sprints?|scrum|agile|backlog|kanban|jira|user stor\\w*','Sprint planifié, tenu|Backlog trié, priorisé'],
      ['projets?|idees?|besoins?|cahiers? des charges|specs?|specifications?','Besoin cadré|Besoin cadré en 30 min|Projet découpé, chiffré'],
      ['paie|paies|bulletins?|fiches? de paie','Paie contrôlée, tracée'],
      ['equipes?|collegues?|collaborat\\w*|rh|salaries?|employes?','Dossier RH à jour|Équipe à jour, informée']
    ];

    /* Le quotidien de bureau, quand aucune famille n'a répondu */
    var VIE=[
      [/\b(?:fraudes?|arnaques?|piratages?|hack\w*|virus|phishing|hameconnage|spams?|ransomware|rancongiciels?|cyberattaques?|attaques?|fuites?)\b/,'Alerte levée, accès coupé|Alerte sécurité levée'],
      [/\b(?:proces|tribunal|tribunaux|avocats?|contentieux|prud'?hom\w*|mises? en demeure|huissiers?)\b/,'Transmis au juridique'],
      [/\b(?:erreurs?|fautes?|oublis?|doublons?|anomalies?|coquilles?)\b/,'Erreur repérée, corrigée|Anomalie corrigée'],
      [/\bfax\b/,'Fax ? Converti en mail.'],
      [/\b(?:imprimantes?|photocopieuses?|toner|cartouches?)\b/,'Bourrage papier évité'],
      [/\b(?:cafes?|expresso|espresso|cappuccino|pauses?)\b/,'Pause méritée, validée'],
      [/\b(?:aperos?|bieres?|vins?|champagne|pot de depart|afterwork)\b/,'Pot d’équipe planifié'],
      [/\b(?:pizzas?|burgers?|sandwichs?|kebabs?|sushis?|tacos|dejeuners?|diners?|repas|restos?|restaurants?|cantine|manger|croissants?|gateaux?|chocolat)\b/,'Note de frais créée'],
      [/\b(chats?|chatons?|chiens?|chiots?|licornes?|dragons?|poneys?|hamsters?|poissons?|lapins?|cheval|chevaux|oiseaux?|vaches?|pokemon)\b/,'~ : hors périmètre|Hors périmètre, hélas'],
      [/\b(?:meteo|pluie|soleil|neige|orages?|canicule)\b/,'Météo : hors périmètre'],
      [/\b(?:foot|football|rugby|tennis|matchs?|psg|sports?)\b/,'Score noté, sans VAR'],
      [/\b(?:dsi|systemes? d'information)\b/,'Branché sur votre SI'],
      [/\b(?:chefs?|cheffes?|patron\w*|boss|n\+1|managers?|direct(?:eur|rice)s?|dg|pdg|ceo|daf|drh|direction)\b/,'Validation en attente|Circuit de validation'],
      [/\b(?:problemes?|soucis?|galeres?|bazar|pagaille|chaos|desordre|foutoir|usine a gaz)\b/,'Désordre trié, étiqueté'],
      [/\b(?:stress|panique|charge mentale|fatigue|flemme|ennui|ras le bol|surcharge)\b/,'Charge allégée, tracée'],
      [/\b(?:argent|fric|thune|oseille|millions?|milliards?|salaires?|augmentations?|primes?|bonus)\b/,'Demande transmise au DAF|Demande au DAF envoyée'],
      [/\b(?:impots?|urssaf|tva|fisc|declarations?|cerfa|administration|prefecture)\b/,'Cerfa prérempli, relu'],
      [/\b(?:mots? de passe|passwords?|mdp|identifiants?|login)\b/,'Réinitialisé sans ticket|Accès réinitialisé'],
      [/\b(?:temps|heures? perdues?|perte de temps|lent\w*|lenteurs?)\b/,'Temps gagné, mesuré'],
      [/\b(?:prix|tarifs?|couts?|cher|chere)\b/,'Chiffrage en cours']
    ];

    /* À défaut : la réponse reprend les mots reçus. Tournures invariables, pour ne rien accorder de travers. */
    var ECHO=['% en 3 clics','% sans paperasse','%, sans réunion','%, sans tableur','%, zéro oubli','%, sans ressaisie','%, de A à Z','% : plus qu’un clic','% en automatique','%, déjà dans le SI','% : zéro papier','% : c’est noté','% : c’est traité','Dossier « % » prêt','Tâche « % » faite','Ticket « % » clos','Rappel « % » posé','Flux « % » lancé','% 2.0'];
    var VERBE=['% : c’est planifié','%, sans y penser','% : fait, tracé'];
    var CLAVIER=['% : clavier OK','% : clavier testé','% : touches testées'];
    var SIGLE=['% : sigle bien noté','% : sigle décodé','Sigle « % » noté'];

    FAM=FAM.map(function(f){return {re:new RegExp('\\b(?:'+f[0]+')\\b'),key:new RegExp('^(?:'+f[0]+')$'),out:f[1].split('|')};});

    /* Le texte tel qu'on le reprend : sans article devant, sans ponctuation autour, sans crier */
    function label(s){
      var x=s.replace(/^[\s"'«»“”(\[]+|[\s"'«»“”)\].,;:!?…]+$/g,''),m,g=0;
      while(g++<3&&(m=/^(?:l['’]|(?:le|la|les|un|une|des|du|de|mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|votre|vos|leur|leurs|ce|cet|cette|ces|the|an?|my)\s+)/i.exec(x))&&x.length>m[0].length)x=x.slice(m[0].length);
      if(x.length>5&&x===x.toUpperCase()&&x!==x.toLowerCase())x=x.toLowerCase();
      if(/^[b-df-hj-np-tv-xz]{2,5}$/.test(x))x=x.toUpperCase();
      return cap(x||s);
    }
    function echo(x,seed,max,list){
      var ok=[],i,t,w,k,room;
      for(i=0;i<list.length;i++)if(list[i].length-1+x.length<=max)ok.push(list[i]);
      if(ok.length)return ok[seed%ok.length].split('%').join(x);
      t=list.slice().sort(function(a,b){return a.length-b.length;})[seed%Math.min(3,list.length)];
      room=max-(t.length-1);w=x.split(' ');k=w.length;
      while(k>1&&w.slice(0,k).join(' ').length>room)k--;
      x=w.slice(0,k).join(' ').replace(/[\s,]+(?:de|du|des|à|a|au|aux|et|ou|en|pour|par|sur|avec|sans|le|la|les|un|une|[ld]['’]?)$/i,'');
      return t.split('%').join(clip(x,room));
    }

    /* Une précision à glisser dans la réponse : un sigle ou un nom propre, sinon un numéro, un mois, un jour, une année */
    function qual(s,n,key){
      var w=s.length>5&&s===s.toUpperCase()?[]:s.split(' '),i,t,tn,nx,m;
      for(i=0;i<w.length;i++){
        t=bare(w[i]);tn=norm(t);
        if(!t||OUTIL.test(tn)||BANAL.test(tn)||key.test(tn)||TEMPS.test(tn))continue;
        m=norm(bare(w[i-1]||''));m=m==='le'?'au ':m==='les'?'aux ':m==='la'?'à la ':/^l'/.test(norm(w[i]))?'à l’':'à ';
        if(/^[A-Z0-9][A-Z0-9&.-]{1,7}$/.test(t)&&/[A-Z]/.test(t))return {t:t,t1:t,a:m,nom:1};
        if(i>0&&NOM.test(t)){nx=bare(w[i+1]||'');return {t:NOM.test(nx)&&!key.test(norm(nx))&&!TEMPS.test(norm(nx))?t+' '+nx:t,t1:t,a:m,nom:1};}
      }
      if((m=/(?:\bn[°o]|#|\bnumero|\bnum\.?)\s*(\d+)/.exec(n)))return {t:'n° '+m[1]};
      if((m=/\b(\d{3,})\b(?!\s*(?:€|euros?|eur|%|k€|onglets?|pages?|lignes?))/.exec(n))&&!/^(?:19|20)\d\d$/.test(m[1]))return {t:'n° '+m[1]};
      if((m=new RegExp('\\b('+MOIS_RE+')\\b').exec(n)))return {t:MOIS[m[1]]};
      if((m=new RegExp('\\b('+JOURS_RE+')s?\\b').exec(n)))return {t:'du '+m[1]};
      if((m=/\b((?:19|20)\d\d)\b/.exec(n)))return {t:m[1]};
      if((m=/\b[tq]([1-4])\b/.exec(n)))return {t:'T'+m[1]};
      return null;
    }
    function fam(f,s,n,seed,max){
      var q=qual(s,n,f.key),a=[],a1=[],b=[],i,t;
      for(i=0;i<f.out.length;i++){
        t=f.out[i];
        if(!/[@%]/.test(t)){b.push(t);continue;}
        if(!q||t.indexOf('@')>=0&&!q.nom)continue;
        if(q.nom)t=t.split('à @').join(q.a+'@');
        a.push(t.split(/[@%]/).join(q.t));if(q.nom)a1.push(t.split(/[@%]/).join(q.t1));
      }
      return choose(a,seed,max)||choose(a1,seed,max)||choose(b,seed,max);
    }
    function table(T,n,seed,max,all){
      var i,m,r;
      for(i=0;i<T.length;i++)if((all||!T[i][2]||n.split(' ').length<3)&&(m=T[i][0].exec(n))){
        r=T[i][1].split('|');
        r=choose(r.filter(function(t){return t.indexOf('~')>=0;}).map(function(t){return t.split('~').join(cap(m[1]||''));}),seed,max)||choose(r.filter(function(t){return t.indexOf('~')<0;}),seed,max);
        if(r)return r;
      }
      return null;
    }

    /* Quatre opérations et des parenthèses, sans eval */
    function calc(e){
      var p=0;
      function num(){var m=/^\d+(?:\.\d+)?/.exec(e.slice(p));if(!m)return NaN;p+=m[0].length;return parseFloat(m[0]);}
      function fac(){var v;if(e.charAt(p)==='('){p++;v=sum();if(e.charAt(p)!==')')return NaN;p++;return v;}if(e.charAt(p)==='-'){p++;return -fac();}return num();}
      function prod(){var v=fac(),c,r;while((c=e.charAt(p))&&'*x×/÷'.indexOf(c)>=0){p++;r=fac();v=(c==='/'||c==='÷')?v/r:v*r;}return v;}
      function sum(){var v=prod(),c,r;while((c=e.charAt(p))==='+'||c==='-'){p++;r=prod();v=c==='+'?v+r:v-r;}return v;}
      var v=sum();return p===e.length?v:NaN;
    }

    /* Un infinitif en tête : la machine s'en charge */
    function verb(w){
      if(/^(?:faire|refaire|prendre|reprendre|vendre|rendre|attendre|repondre|lire|relire|ecrire|dire|mettre|remettre|suivre|vivre|boire|croire|conduire|construire|produire|reduire|traduire|connaitre|apprendre|comprendre|voir|revoir|savoir|vouloir|pouvoir|devoir|recevoir|prevoir|rire|sourire|conclure|inclure|resoudre|joindre|rejoindre|peindre|eteindre|battre|perdre|descendre|defendre|entendre|etendre|agir|unir)$/.test(w)||/(?:prendre|mettre|duire|truire|crire|soudre|aindre|eindre|oindre|clure|(?:re|de|par|satis)faire|(?:re|pre|inter)dire)$/.test(w))return true;
      if(/^[a-z-]{2,}[^o]ir$/.test(w))return !/^(?:plaisir|loisir|desir|avenir|souvenir|soupir|saphir|elixir|menhir|kefir)$/.test(w);
      if(!/^[a-z-]{3,}er$/.test(w))return false;
      if(/ier$/.test(w))return /(?:fier|trier|crier|prier|skier|copier|plier|etudier|publier|expedier|remercier|apprecier|negocier|oublier|parier|confier|relier|associer|initier|marier|varier|envier)$/.test(w);
      return !/^(?:hiver|laser|poster|manager|leader|designer|server|computer|amer|enfer|diner|dejeuner|gouter|boulanger|boucher|etranger|danger|leger|loyer|foyer|oreiller|conseiller|cahier|super|hyper|cyber|flyer|burger|hamburger|hamster|master|cluster|poker|joker|hacker|maker|cher|user|order|power|after|never|over|number|letter|partner)$/.test(w);
    }

    function rules(s,n,seed,max){
      var m,x,v,e,i,r,one=n.indexOf(' ')<0,c=function(l){return choose(l,seed,max);};

      /* ni lettre ni chiffre : ponctuation, émojis */
      if(!/[a-z0-9À-\u1fff\u2c00-\ud7ff]/.test(n)){
        if(/[\u2764\u2665]|\ud83d[\udc93-\udc9f]|\ud83d\ude0d|\ud83e\udd70/.test(s))return 'Sentiment bien reçu';
        if(/\ud83d\udc4d|\ud83d\udc4c|[\u2705\u2714]/.test(s))return 'Validation enregistrée';
        if(/[\ud83c-\ud83e][\udc00-\udfff]|[\u2600-\u27bf]/.test(s))return c(['Bonne humeur consignée','Émoji bien reçu']);
        if(n.indexOf('?')>=0)return c(['Réponse : ça dépend','Réponse : 42']);
        if(n.indexOf('!')>=0)return 'Reçu, sans crier';
        if(/[€$£]/.test(n))return 'Montant à préciser';
        if(/\.\.|…/.test(n))return 'Suspense bien noté';
        return 'Signes reçus, sens flou';
      }

      if(/jours?[- ]hommes?|hommes?[- ]jours?/.test(n))return 'Charge estimée, tracée';
      if(GRAVE.test(n))return 'À traiter entre humains';
      if(GENS.test(n.replace(/\b(?:carte|maison|societe|entreprise) meres?\b|\bsocietes? filles?\b|\bfamilles? de\b|\bhomme-machine\b/g,'')))return 'On ne trie pas les gens';
      if(CREDO.test(n))return 'Hors périmètre, promis';
      if(GROS.test(n))return c(['Reformulé poliment','Version polie archivée']);

      /* les curieux qui testent la porte : tout s'affiche comme du texte, rien ne s'exécute */
      if(/<[a-z!\/][^>]*>/.test(n))return 'Balises neutralisées';
      if(/['"]\s*(?:or|and)\s+['"]?\d|drop table|select .* from|union select|\{\{.*\}\}|\$\{.*\}|\.\.\/|;--|javascript:/.test(n))return 'Injection ? Bien tenté.';

      /* les formes : téléphone, date, heure, adresse, lien, fichier, montant, pourcentage, calcul, nombre */
      x=n.replace(/\s/g,'');
      if(/^(?:\+\d{1,3}|0)[1-9](?:[.-]?\d{2}){4}$/.test(x))return c(['Numéro rangé au CRM','Appel consigné au CRM']);
      if((m=/^(\d{1,2})\/(\d{1,2})(?:\/(?:\d{2}|\d{4}))?$/.exec(x))&&+m[1]>=1&&+m[1]<=31&&+m[2]>=1&&+m[2]<=12||/^\d{4}-\d{2}-\d{2}$/.test(x)||/^\d{1,2}-\d{1,2}-\d{4}$/.test(x)||new RegExp('^(?:le )?\\d{1,2}(?:er)? (?:'+MOIS_RE+')(?: \\d{4})?$').test(n))return c(['Rappel posé le '+s.replace(/^le /i,'')])||(c(['Rappel posé à cette date'])||'Rappel posé, bien daté');
      if(/^(?:ce |le |les )?lundis?(?: matin)?$/.test(n))return 'Lundi, mais en mieux';
      if(/^(?:ce |le |les )?vendredis?(?: soir| apres-midi)?$/.test(n))return 'Week-end en approche';
      if((m=/^(?:ce |le |les )?(mardi|mercredi|jeudi)s?$/.exec(n)))return cap(m[1])+' : rappel posé';
      if(/^(?:ce |le |les )?(?:samedi|dimanche)s?$|^(?:ce |le )?week-?end$/.test(n))return 'Repos mérité, bien noté';
      if((m=new RegExp('^(?:en |mois de |ce mois de )?('+MOIS_RE+')$').exec(n)))return c(['Clôture '+MOIS[m[1]]+' prête'])||'Mois clôturé, tracé';
      if(/^demain(?: matin| soir| midi)?$/.test(n))return 'Rappel posé : demain';
      if(/^hier(?: soir| matin)?$/.test(n))return 'Trop tard, mais tracé';
      if(/^(?:aujourd'hui|ce matin|ce soir|maintenant|tout de suite|la maintenant|de suite|now)$/.test(n))return 'C’est parti, et tracé';
      if(/^(?:plus tard|un jour|bientot|apres|la semaine prochaine|semaine prochaine|le mois prochain|l'annee prochaine|later)$/.test(n))return 'Rappel posé, sans oubli';
      if(/^\d{1,2}h(?:\d{2})?$|^\d{1,2}:\d{2}$/.test(x))return c(['Créneau '+s+' bloqué'])||'Créneau bloqué';
      if(n==='midi')return 'Pause déjeuner bloquée';
      if(n==='minuit')return 'Lot de nuit lancé';
      if(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(n)){x=s.split('@')[0];e=cap(x.split(/[._-]/)[0]);return c(['Contact « '+x+' » créé',x+' : contact créé'])||c(['Contact « '+e+' » créé'])||'Contact créé, sans spam';}
      if(/^(?:https?:\/\/|www\.)\S+$/.test(n)||/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:fr|com|net|org|io|eu|ai|dev|app|be|ch|ca|uk|de|es|it)(?:\/\S*)?$/.test(n)){
        x=n.replace(/^https?:\/\//,'').replace(/^www\./,'').split(/[\/?#]/)[0];
        if(x==='wigaly.fr')return 'Vous y êtes déjà';
        return c([x+' : lien vérifié','Lien « '+x+' » vérifié'])||c([x+' : vérifié'])||'Lien vérifié, archivé';
      }
      if(one&&(m=/\.(xlsx?|xlsm|csv|docx?|pdf|pptx?|png|jpe?g|gif|zip|rar|txt|json|xml|msg|eml)$/.exec(n))){
        if(/final|v\d+|_ok|bis|copie|copy|\(\d+\)|def|new|old|vf/.test(n))return 'Une seule version';
        e=m[1];
        return /^(?:xls|csv)/.test(e)?'Un tableau de bord':/^(?:doc|txt)/.test(e)?'Document classé, indexé':e==='pdf'?'Champs extraits':/^ppt/.test(e)?'Dix diapos de moins':/^(?:png|jpe?g|gif)$/.test(e)?'Texte extrait, indexé':/^(?:zip|rar)$/.test(e)?'Archive ouverte, triée':/^(?:msg|eml)$/.test(e)?'Mail trié, résumé':'Données structurées';
      }
      if(/^\d[\d\s.,]*\s?[km]?\s?(?:€|euros?|eur|\$|dollars?|usd|£|balles)$/.test(n))return c([s+' : écriture passée',s+' : c’est rapproché'])||'Montant rapproché';
      if(/^[+-]?\d+(?:[.,]\d+)?\s?%$/.test(n))return c([s+' : tendance tracée','Indicateur à jour : '+s])||'Tendance tracée';
      if(/^[\d.,+\-*x×\/÷()]+(?:=[\d.,]*)?\??$/.test(x)&&/\d\)?[+\-*x×\/÷]+\(?-?\d/.test(x)){
        e=x.replace(/\?$/,'').replace(/,/g,'.').split('=');v=calc(e[0]);
        if(v===v){
          if(v===Infinity||v===-Infinity)return c(['Division par zéro évitée'])||'Par zéro ? On évite.';
          if(e.length>1&&e[1]!=='')return Math.abs(v-parseFloat(e[1]))<1e-9?'Exact, et vérifié':c(['Erreur trouvée : = '+fr(v)])||'Erreur corrigée';
          return c(['= '+fr(v)+', c’est vérifié','= '+fr(v)+', vérifié deux fois','Résultat : '+fr(v)])||'Calcul vérifié';
        }
      }
      if(/^\d[\d\s.,]*$/.test(n)){
        if(/^0+$/.test(x))return 'Zéro : rien à signaler';
        if(x==='42')return 'La réponse, justement';
        if(x==='007')return 'Dossier classé secret';
        if(x==='404')return 'Page retrouvée';
        if(/^3[.,]14/.test(x))return 'Pi arrondi, classé';
        if(/^(?:19|20)\d\d$/.test(x))return 'Archives '+x+' classées';
        if(x.replace(/\D/g,'').length>=9)return 'Référence vérifiée';
        return c([s+' : compté, vérifié','Total vérifié : '+s])||'Total vérifié';
      }

      if((r=table(DIRE,n,seed,max)))return r;
      for(i=0;i<FAM.length;i++)if(FAM[i].re.test(n)&&(r=fam(FAM[i],s,n,seed,max)))return r;
      if(/(?:^|\s)thés?(?:\s|$)/i.test(s))return 'Pause méritée, validée';
      if((r=table(VIE,n,seed,max))||(r=table(DIRE,n,seed,max,1)))return r;

      /* une question sans famille : on répond selon le mot interrogatif */
      if(/\?\s*$/.test(s)||/^(?:pourquoi|comment|combien|quand|qui|quel|quelle|quels|quelles|est-ce|c'est quoi|quoi|qu'est-ce)\b/.test(n)||/^où(?:\s|$)/i.test(s)){
        if(/^pourquoi\b/.test(n))return 'Cause tracée, corrigée';
        if(/^comment\b/.test(n))return 'Procédure rédigée';
        if(/^combien\b/.test(n))return 'Chiffrage en cours';
        if(/^quand\b/.test(n))return 'Date posée à l’agenda';
        if(/^où(?:\s|$)/i.test(s))return 'Localisé, puis rangé';
        if(/^qui\b/.test(n))return 'Responsable identifié';
        return c(['Réponse : ça dépend','Question bien routée','Bonne question, notée']);
      }

      /* trop court, un sigle (on le note sans rien en dire), ou le clavier pour seul sujet */
      if(/^[a-z]{1,2}$/.test(n)&&s!==s.toUpperCase()||OUTIL.test(n))return 'Un peu court, mais noté';
      if(one&&/^[a-z]{3,}$/.test(n)){
        if(/(.)\1{2,}/.test(n))return 'Cri bien enregistré';
        v=(n.match(/[aeiouy]/g)||[]).length;
        if(/azer|zert|erty|rtyu|tyui|yuio|uiop|qsdf|sdfg|dfgh|fghj|ghjk|hjkl|jklm|wxcv|xcvb|cvbn|qwer|wert|asdf|zxcv/.test(n)||n.length>5&&!v||/[^aeiouy]{5,}/.test(n))return echo(cap(s.toLowerCase()),seed,max,CLAVIER);
      }
      if(one&&(/^[A-Z0-9&.-]{2,6}$/.test(s)&&/[A-Z]/.test(s)||/^[b-df-hj-np-tv-xz]{3,5}$/.test(n)))return echo(s.toUpperCase(),seed,max,SIGLE);

      /* un verbe en tête, éventuellement après « il faut » */
      x=n.replace(/^(?:je (?:veux|voudrais|dois|vais|souhaite)|j'aimerais|il faut|faut|on doit|il faudrait|merci de|peux-tu|pouvez-vous|tu peux|vous pouvez|svp|stp|a faire ?:?|todo ?:?)\s+/,'');
      var ws=x.split(' '),o=s.split(' '),off=o.length-ws.length;
      if(verb(bare(ws[0]))){
        x=label(o.slice(off).join(' '));
        return echo(x.length<=max-14?x:cap(bare(o[off])),seed,max,VERBE);
      }

      /* une phrase : on en garde les deux mots qui pèsent */
      if(ws.length>=4){
        var sig=[];
        for(i=off;i<o.length;i++){x=bare(o[i]).replace(/^[a-zA-Z]['’]/,'');m=norm(x);if(m.length>=3&&!OUTIL.test(m)&&!verb(m))sig.push(x.toLowerCase());}
        if(sig.length>1&&(r=c(['Résumé : '+sig[0]+', '+sig[1],'En bref : '+sig[0]+', '+sig[1]])))return r;
        if(sig.length&&label(s).length>max-4)return echo(cap(sig[0]),seed,max,ECHO);
      }
      return null;
    }

    return function(raw,max){
      max=max||25;
      var s=String(raw==null?'':raw).replace(/\s+/g,' ').trim(),n=norm(s),seed=hash(n);
      return typo(clip(rules(s,n,seed,max)||echo(label(s),seed,max,ECHO),max));
    };
  }

  var go=null;
  function reply(raw,max){return (go||(go=build()))(raw,max);}
  reply.clip=clip;
  return reply;
})();
