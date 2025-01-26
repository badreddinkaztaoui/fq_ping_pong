import os
import django
from django.core.mail import send_mail
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_email_configuration():
    """
    Test the email configuration by sending a test email.
    This function attempts to send an email using Django's email system
    and provides feedback about the process.
    """
    try:
        # Print current email settings for verification
        print("\nCurrent Email Settings:")
        print(f"EMAIL_HOST: {settings.EMAIL_HOST}")
        print(f"EMAIL_PORT: {settings.EMAIL_PORT}")
        print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
        print(f"EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
        print(f"DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")

        # Attempt to send test email
        print("\nAttempting to send test email...")
        
        send_mail(
            subject='Django Email Test',
            message='If you receive this email, your Django email configuration is working correctly!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],  # Sending to ourselves for testing
            fail_silently=False,
        )
        
        print("✅ Email sent successfully!")
        print("Please check your inbox (and spam folder) for the test email.")
        
    except Exception as e:
        print("\n❌ Error sending email:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nPlease verify your email settings and credentials.")

if __name__ == '__main__':
    test_email_configuration()