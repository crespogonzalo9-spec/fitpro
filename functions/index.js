const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Trigger: Se ejecuta cada vez que se crea o edita un usuario en Firestore.
 * Acción: Copia el 'rol' y el 'gymId' del documento hacia los Custom Claims (Token).
 */
exports.updateUserClaims = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
        const userId = context.params.userId;
        const newData = change.after.exists ? change.after.data() : null;

        // Si el usuario fue borrado, no hacemos nada (o podríamos borrar claims)
        if (!newData) return null;

        // Preparamos los datos de seguridad
        const customClaims = {
            roles: newData.roles || [],      // Array de roles
            gymId: newData.gymId || null,    // ID del gimnasio
            // Flag rápido para saber si es sysadmin sin recorrer arrays
            isSysadmin: (newData.roles || []).includes('sysadmin')
        };

        try {
            // Inyectamos esto en la autenticación de Firebase
            await admin.auth().setCustomUserClaims(userId, customClaims);
            console.log(`✅ Claims actualizados para ${userId}`, customClaims);
        } catch (error) {
            console.error(`❌ Error actualizando claims para ${userId}:`, error);
        }
    });