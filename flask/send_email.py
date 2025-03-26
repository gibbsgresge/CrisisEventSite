# send_email.py

import smtplib
from email.message import EmailMessage

def send_email(sender_email, sender_password, recipient_email, subject, body):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient_email
    msg.set_content(body)

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as smtp:
            smtp.starttls()
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print(f"Email sent to {recipient_email}!")
    except Exception as e:
        print(f"Failed to send email: {e}")

# Example usage
if __name__ == "__main__":
    sender = "crisiseventtemplant@gmail.com"
    password = "awhh hmvo syfp yiyn"  # App password
    recipient = "gibbsgresge@vt.edu"
    subject = "Your Crisis Event Summary is Ready"
    body = (
        "Hi Gibbs,\n\n"
        "Your Crisis Event Templant summary has been successfully generated.\n"
        "You can return to the landing page to view the finalized details.\n\n"
        "If you have any questions, feel free to reply to this email.\n\n"
        "Best regards,\n"
        "The Templant Team"
    )

    send_email(sender, password, recipient, subject, body)
