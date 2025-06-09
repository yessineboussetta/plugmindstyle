# utils/email.py

import os
from email.message import EmailMessage
import aiosmtplib
from dotenv import load_dotenv

load_dotenv()

async def send_verification_email(to_email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")  # ✅ correct base

    verification_link = f"{frontend_url}/verify/{token}"  # ✅ no repetition

    msg = EmailMessage()
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = to_email
    msg["Subject"] = "Verify your Plugmind account"

    msg.set_content(
        f"Welcome to Plugmind!\n\nClick the link below to verify your email:\n{verification_link}"
    )

    await aiosmtplib.send(
        msg,
        hostname=os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        port=int(os.getenv("SMTP_PORT", 587)),
        start_tls=True,
        username=os.getenv("EMAIL_USER"),
        password=os.getenv("EMAIL_PASS"),
    )
    print("✅ Full verification URL sent in email:", verification_link)

async def send_password_reset_email(to_email: str, reset_link: str):
    msg = EmailMessage()
    msg["From"] = os.getenv("EMAIL_USER")
    msg["To"] = to_email
    msg["Subject"] = "Reset your Plugmind password"

    msg.set_content(
        f"Hello,\n\n"
        f"You have requested to reset your password for your Plugmind account.\n\n"
        f"Click the link below to reset your password:\n{reset_link}\n\n"
        f"This link will expire in 1 hour.\n\n"
        f"Important: You can only change your password once every 8 hours. "
        f"If you've changed your password in the last 8 hours, you'll need to wait before requesting another reset.\n\n"
        f"If you did not request this password reset, please ignore this email.\n\n"
        f"Best regards,\nThe Plugmind Team"
    )

    await aiosmtplib.send(
        msg,
        hostname=os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        port=int(os.getenv("SMTP_PORT", 587)),
        start_tls=True,
        username=os.getenv("EMAIL_USER"),
        password=os.getenv("EMAIL_PASS"),
    )
    print("✅ Password reset email sent to:", to_email)

