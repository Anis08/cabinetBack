# 📱 WhatsApp Notifications - Guide Complet

## ✅ Fonctionnalité Implémentée

Système automatique d'envoi de rappels WhatsApp **24 heures avant** chaque rendez-vous.

### Caractéristiques:
- ✅ **Cron Job automatique** - Vérifie et envoie les rappels 2x par jour
- ✅ **Messages personnalisés** - Nom du patient, date, heure, tarif
- ✅ **Support Twilio** - API WhatsApp officielle
- ✅ **Gestion des erreurs** - Logs détaillés et fallback
- ✅ **API manuelle** - Envoi de test et déclenchement manuel
- ✅ **Tracking** - Enregistrement dans les notes de RDV

---

## 🚀 Installation

### Étape 1: Packages Installés ✅

```bash
npm install node-cron twilio
```

**Déjà fait!** ✅

---

## 📋 Configuration Twilio

### Étape 2: Créer un Compte Twilio

1. **Allez sur**: https://www.twilio.com/try-twilio
2. **Créez un compte gratuit**
3. **Vérifiez votre email**

### Étape 3: Obtenir les Credentials

#### Option A: Twilio Sandbox (GRATUIT - Pour Test)

1. Dans Twilio Console: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Suivez les instructions pour:
   - Scanner le QR code avec WhatsApp
   - Envoyer le code d'activation (ex: `join <code>`)
3. Copiez vos credentials:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Cliquez sur "Show" pour voir
   - **WhatsApp Number**: `whatsapp:+14155238886` (numéro sandbox)

#### Option B: WhatsApp Business API (PRODUCTION)

1. Demandez l'accès à WhatsApp Business API
2. Configurez votre numéro WhatsApp Business
3. Obtenez l'approbation de Facebook
4. Utilisez votre propre numéro: `whatsapp:+212XXXXXXXXX`

**Pour commencer, utilisez le Sandbox (Option A)** 🎯

---

## ⚙️ Configuration Backend

### Étape 4: Ajouter les Variables d'Environnement

Créez ou modifiez votre fichier `.env`:

```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# Autres variables existantes...
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
```

⚠️ **Remplacez** les valeurs par vos vraies credentials Twilio!

---

## 🧪 Test de Configuration

### Étape 5: Tester Manuellement

#### Test 1: API de Test Manuel

```bash
# 1. Obtenez votre token JWT (depuis le frontend après login)
TOKEN="your-jwt-token-here"

# 2. Déclencher l'envoi des rappels manuellement
curl -X POST http://localhost:4000/medecin/whatsapp-notifications/trigger-reminders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue:**
```json
{
  "message": "Reminders processed",
  "result": {
    "success": true,
    "sent": 2,
    "failed": 0,
    "details": [...]
  }
}
```

#### Test 2: Envoyer Rappel pour un RDV Spécifique

```bash
curl -X POST http://localhost:4000/medecin/whatsapp-notifications/send-reminder/123 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Remplacez `123` par un vrai ID de rendez-vous!**

---

## 📅 Fonctionnement Automatique

### Planification Automatique

Le système envoie automatiquement les rappels:

| Heure | Timezone | Action |
|-------|----------|--------|
| **9:00 AM** | Africa/Casablanca | Envoi des rappels du matin |
| **6:00 PM** | Africa/Casablanca | Envoi des rappels du soir |

### Conditions d'Envoi:

✅ RDV prévu **demain** (dans 24h)  
✅ État du RDV = `Scheduled`  
✅ Patient a un numéro de téléphone  
✅ Rappel pas déjà envoyé (vérifié dans les notes)

---

## 📱 Format des Messages

### Template de Message:

```
🏥 *Rappel de Rendez-vous*

Bonjour [Nom Patient],

Ceci est un rappel pour votre rendez-vous chez [Nom Médecin].

📅 Date: lundi 12 novembre 2024
⏰ Heure: 10:00
💰 Tarif: 200DH

Merci de confirmer votre présence ou de nous contacter pour tout changement.

À demain! 👋
```

### Personnalisation:

Le message est automatiquement personnalisé avec:
- Nom du patient
- Nom du médecin
- Date formatée en français
- Heure du RDV
- Tarif de consultation

---

## 🔧 API Endpoints

### 1. Déclencher Rappels Manuellement

```http
POST /medecin/whatsapp-notifications/trigger-reminders
Authorization: Bearer {token}
```

**Utilité**: Test ou envoi manuel (ne respecte pas l'horaire planifié)

### 2. Envoyer Rappel pour un RDV

```http
POST /medecin/whatsapp-notifications/send-reminder/:appointmentId
Authorization: Bearer {token}
```

**Utilité**: Envoyer un rappel immédiat pour un RDV spécifique

### 3. Obtenir les Stats

```http
GET /medecin/whatsapp-notifications/stats
Authorization: Bearer {token}
```

**Réponse**:
```json
{
  "message": "WhatsApp notification system active",
  "schedule": [
    "Daily at 9:00 AM (Morocco time)",
    "Daily at 6:00 PM (Morocco time)"
  ],
  "info": "Reminders are sent 24 hours before scheduled appointments"
}
```

---

## 📊 Logs et Monitoring

### Voir les Logs du Serveur:

```bash
# Si vous utilisez nohup
tail -f server.log

# Ou si serveur dans terminal
# Les logs s'affichent directement
```

### Exemples de Logs:

```
🕐 Starting WhatsApp reminder scheduler...
✅ Twilio WhatsApp client initialized
✅ Reminder scheduler started (runs daily at 9:00 AM)
✅ Evening reminder scheduler started (runs daily at 6:00 PM)

⏰ Running scheduled reminder check at 11/12/2024, 09:00:00
🔍 Checking for appointments to remind...
📋 Found 3 appointments for tomorrow
✅ WhatsApp message sent to +212600000000: SM...
✅ Reminders sent: 3, Failed: 0
```

---

## ⚠️ Gestion des Erreurs

### Si Twilio n'est pas configuré:

```
⚠️  Twilio credentials not configured. WhatsApp notifications disabled.
   Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_NUMBER in .env
```

**Solution**: Ajoutez les credentials dans `.env`

### Si pas de numéro de téléphone:

```
⚠️  No phone number for patient John Doe
```

**Solution**: Le système skip automatiquement ces patients

### Si message échoue:

```
❌ Failed to send WhatsApp message to +212600000000: Invalid phone number
```

**Solution**: Vérifiez le format du numéro de téléphone

---

## 🇲🇦 Format des Numéros Marocains

Le système gère automatiquement les formats:

| Format Patient | Converti en | WhatsApp Format |
|----------------|-------------|-----------------|
| `0612345678` | `+212612345678` | `whatsapp:+212612345678` |
| `212612345678` | `+212612345678` | `whatsapp:+212612345678` |
| `+212612345678` | `+212612345678` | `whatsapp:+212612345678` |
| `06 12 34 56 78` | `+212612345678` | `whatsapp:+212612345678` |

**Le système ajoute automatiquement +212 si nécessaire!**

---

## 🎨 Frontend Integration (Optionnel)

### Bouton d'Envoi Manuel dans Dashboard:

```jsx
const sendManualReminder = async () => {
  try {
    const token = localStorage.getItem('accessToken')
    const response = await fetch(
      `${baseURL}/medecin/whatsapp-notifications/trigger-reminders`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    const data = await response.json()
    alert(`Rappels envoyés: ${data.result.sent}`)
  } catch (err) {
    alert('Erreur lors de l\'envoi des rappels')
  }
}

// Dans le JSX:
<button onClick={sendManualReminder}>
  📱 Envoyer Rappels WhatsApp
</button>
```

---

## 💰 Coûts Twilio

### Sandbox (GRATUIT):
- ✅ Gratuit pour toujours
- ⚠️ Limité aux numéros qui ont rejoint le sandbox
- ⚠️ Messages avec préfixe Twilio

### Production (WhatsApp Business API):
- 💵 ~$0.005 par message (conversation)
- 💵 Varie selon le pays
- ✅ Pas de limite de numéros
- ✅ Messages professionnels

**Pour 100 patients/jour**: ~$0.50/jour = ~$15/mois

---

## 🔐 Sécurité

### Variables d'Environnement:
- ✅ Credentials dans `.env` (pas dans le code)
- ✅ `.env` dans `.gitignore`
- ✅ Utilisez `.env.example` pour la documentation

### API Routes:
- ✅ Protégées par JWT (`verifyAccessToken`)
- ✅ Seuls les médecins connectés peuvent déclencher

---

## 🧩 Architecture du Code

```
src/
├── services/
│   └── whatsappNotificationService.js    # Service principal
│       ├── initializeTwilio()            # Config Twilio
│       ├── formatPhoneNumber()           # Format numéros
│       ├── generateAppointmentMessage()  # Template message
│       ├── sendWhatsAppMessage()         # Envoi message
│       ├── sendAppointmentReminder()     # Rappel pour 1 RDV
│       ├── checkAndSendReminders()       # Vérifie tous les RDV
│       └── startReminderScheduler()      # Démarre cron jobs
│
├── routes/
│   └── whatsappNotifications.js          # API endpoints
│       ├── POST /trigger-reminders       # Manuel trigger
│       ├── POST /send-reminder/:id       # Rappel spécifique
│       └── GET /stats                    # Statistiques
│
└── server.js
    └── startReminderScheduler()          # Initialisé au démarrage
```

---

## 📝 Checklist de Mise en Production

- [ ] 1. Créer compte Twilio
- [ ] 2. Configurer WhatsApp Sandbox (ou Business API)
- [ ] 3. Ajouter credentials dans `.env`
- [ ] 4. Redémarrer le serveur
- [ ] 5. Vérifier logs: `✅ Twilio WhatsApp client initialized`
- [ ] 6. Créer un RDV de test pour demain
- [ ] 7. Tester avec API manuelle
- [ ] 8. Vérifier que le message WhatsApp est reçu
- [ ] 9. Attendre 9:00 AM le lendemain (test auto)
- [ ] 10. Monitorer les logs pour confirmer envoi

---

## 🆘 Troubleshooting

### Problème: "Twilio not configured"

**Cause**: Variables `.env` manquantes ou incorrectes  
**Solution**: Vérifiez `.env` et redémarrez serveur

### Problème: "Invalid phone number"

**Cause**: Format numéro incorrect  
**Solution**: Le système devrait auto-corriger. Vérifiez que le numéro est valide

### Problème: "Forbidden"

**Cause**: Numéro pas dans sandbox  
**Solution**: Envoyez le code join depuis WhatsApp

### Problème: Messages pas envoyés automatiquement

**Cause**: Serveur redémarré / Cron pas lancé  
**Solution**: Vérifiez logs au démarrage pour "Reminder scheduler started"

---

## 🎯 Prochaines Améliorations Possibles

1. **Table dédiée** pour tracking des notifications
2. **Dashboard UI** pour voir historique d'envois
3. **Templates personnalisables** par médecin
4. **Support SMS** en fallback
5. **Confirmation de lecture** (webhooks Twilio)
6. **Multi-langue** (Français/Arabe/Anglais)
7. **Rappels multiples** (48h, 24h, 2h avant)
8. **Statistiques** de taux de confirmation

---

## 📚 Ressources

- **Twilio Docs**: https://www.twilio.com/docs/whatsapp
- **Twilio Console**: https://console.twilio.com/
- **WhatsApp Business**: https://www.whatsapp.com/business
- **Node-cron**: https://www.npmjs.com/package/node-cron

---

## ✅ Résumé

🎉 **Le système est prêt à l'emploi!**

1. ✅ Code implémenté
2. ✅ Routes API créées
3. ✅ Cron jobs configurés
4. ⏳ Il ne reste qu'à configurer Twilio dans `.env`

**Après configuration Twilio → Les rappels WhatsApp seront envoyés automatiquement! 🚀**
