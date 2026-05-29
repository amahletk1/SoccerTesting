// lib/notifications.ts
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export async function sendNotification(
  userId: string,
  recipientType: 'player' | 'agent' | 'scout' | 'admin',
  subject: string,
  message: string
) {
  try {
    const { error } = await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        recipient_type: recipientType,
        subject: subject,
        message: message,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error creating notification:', error)
      return false
    }
    return true
  } catch (err) {
    console.error('Notification error:', err)
    return false
  }
}

// Notification Templates
export const NotificationTemplates = {
  playerProfileSubmitted: (name: string) => ({
    subject: 'Profile Submitted for Approval',
    message: `Dear ${name},\n\nThank you for completing your profile on PlayerFynder!\n\nYour profile has been submitted and is pending admin approval. You will be notified once approved.\n\nBest regards,\nPlayerFynder Team`
  }),

  playerProfileApproved: (name: string) => ({
    subject: 'Your Profile Has Been Approved! 🎉',
    message: `Dear ${name},\n\nCongratulations! Your profile has been approved!\n\nBest regards,\nPlayerFynder Team`
  }),

  newPlayerRegistration: (playerName: string) => ({
    subject: 'New Player Registration - Pending Approval',
    message: `A new player has registered and needs approval.\n\nName: ${playerName}\n\nPlease review in the Admin Panel.`
  }),

  newAgentRegistration: (agentName: string, agentEmail: string, agency?: string) => ({
    subject: 'New Agent Registration - Pending Verification',
    message: `A new agent has registered.\n\nName: ${agentName}\nEmail: ${agentEmail}\nAgency: ${agency || 'Independent'}\n\nPlease review in the Admin Panel.`
  }),

  agentProfileCreated: (name: string) => ({
    subject: 'Agent Profile Created',
    message: `Dear ${name},\n\nYour agent profile has been created successfully!\n\nBest regards,\nPlayerFynder Team`
  }),
}