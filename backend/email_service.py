import os
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, From, To, Subject, HtmlContent, PlainTextContent
from typing import Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Get SendGrid API key from environment
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not found in environment variables")
        else:
            logger.info(f"SendGrid API key loaded: {self.api_key[:20]}...")
        
        self.sender_email = os.environ.get('SENDER_EMAIL', 'info@quattrostand.com')
        self.sg = SendGridAPIClient(self.api_key) if self.api_key else None
        
        logger.info(f"Email service initialized with sender: {self.sender_email}")

    def send_survey_invitation(self, customer_data: dict, project_data: dict, survey_link: str) -> dict:
        """Send survey invitation email to customer"""
        try:
            if not self.sg:
                logger.error("SendGrid client not initialized - missing API key")
                return {"success": False, "error": "Email service not configured"}

            # Create personalized email content
            subject = f"{project_data['fairName']} - Müşteri Memnuniyet Anketi"
            
            html_content = self._generate_survey_email_html(customer_data, project_data, survey_link)
            plain_content = self._generate_survey_email_text(customer_data, project_data, survey_link)

            # Create SendGrid mail object
            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Quattro Stand"),
                to_emails=To(customer_data['email']),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )

            # Send email
            response = self.sg.send(message)
            
            logger.info(f"Survey invitation sent to {customer_data['email']} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "Survey invitation sent successfully"
            }

        except Exception as e:
            logger.error(f"Failed to send survey invitation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def send_test_email(self, to_email: str) -> dict:
        """Send test email to verify SendGrid configuration"""
        try:
            if not self.sg:
                return {"success": False, "error": "Email service not configured"}

            subject = "Vitingo CRM - Test Email"
            html_content = """
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px;">✅ Test Email Başarılı!</h1>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <h2 style="color: #333;">Merhaba!</h2>
                        <p style="color: #555; line-height: 1.6; font-size: 16px;">
                            Bu bir test emailidir. SendGrid entegrasyonu başarıyla çalışıyor! 🎉
                        </p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                            <h3 style="color: #333; margin-top: 0;">Test Detayları:</h3>
                            <ul style="color: #555; line-height: 1.8;">
                                <li><strong>Gönderen:</strong> info@quattrostand.com</li>
                                <li><strong>Servis:</strong> SendGrid API</li>
                                <li><strong>Tarih:</strong> {current_date}</li>
                                <li><strong>Sistem:</strong> Vitingo CRM</li>
                            </ul>
                        </div>
                        
                        <p style="color: #555; line-height: 1.6;">
                            Artık müşteri memnuniyet anketlerini gerçek email olarak gönderebilirsiniz!
                        </p>
                    </div>
                    
                    <div style="background: #333; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">
                            Vitingo CRM | Fuar Stand Üretim ve Tasarım
                        </p>
                    </div>
                </body>
            </html>
            """.replace("{current_date}", self._get_current_date())

            plain_content = f"""
            Vitingo CRM - Test Email

            Merhaba!

            Bu bir test emailidir. SendGrid entegrasyonu başarıyla çalışıyor!

            Test Detayları:
            - Gönderen: info@quattrostand.com  
            - Servis: SendGrid API
            - Tarih: {self._get_current_date()}
            - Sistem: Vitingo CRM

            Artık müşteri memnuniyet anketlerini gerçek email olarak gönderebilirsiniz!

            Vitingo CRM | Fuar Stand Üretim ve Tasarım
            """

            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Test"),
                to_emails=To(to_email),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )

            response = self.sg.send(message)
            
            logger.info(f"Test email sent to {to_email} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": f"Test email sent successfully to {to_email}"
            }

        except Exception as e:
            logger.error(f"Failed to send test email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def send_handover_invitation(self, customer_data: dict, project_data: dict, handover_link: str) -> dict:
        """Send handover invitation email to customer"""
        try:
            if not self.sg:
                logger.error("SendGrid client not initialized - missing API key")
                return {"success": False, "error": "Email service not configured"}

            # Determine language and create appropriate subject
            language = project_data.get('language', 'tr')
            if language == 'tr':
                subject = f"{project_data['name']} - Fuar Standı Teslim Formu"
            else:
                subject = f"{project_data['name']} - Fair Stand Handover Form"
            
            html_content = self._generate_handover_email_html(customer_data, project_data, handover_link, language)
            plain_content = self._generate_handover_email_text(customer_data, project_data, handover_link, language)

            # Create SendGrid mail object
            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Quattro Stand"),
                to_emails=To(customer_data['email']),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )

            # Send email
            response = self.sg.send(message)
            
            logger.info(f"Handover invitation sent to {customer_data['email']} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "Handover invitation sent successfully"
            }

        except Exception as e:
            logger.error(f"Failed to send handover invitation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    def _generate_handover_email_html(self, customer_data: dict, project_data: dict, handover_link: str, language: str = 'tr') -> str:
        """Generate HTML content for handover invitation email"""
        if language == 'tr':
            return f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">🏗️ Fuar Standınız Hazır!</h1>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">Sayın <strong>{customer_data['contact']}</strong>,</p>
                        
                        <p style="color: #555; line-height: 1.6;">
                            <strong>{project_data['name']}</strong> projeniz kapsamında hazırlanan fuar standınız tamamlanmış ve teslime hazır haldedir.
                        </p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <h3 style="color: #333; margin-top: 0;">📋 Teslim İşlemi:</h3>
                            <p style="color: #555; line-height: 1.8; margin-bottom: 10px;">
                                Standınızı teslim almak için aşağıdaki linke tıklayarak teslim formunu doldurunuz.
                                Bu form ile standın eksiksiz ve çalışır durumda teslim edildiğini onaylayacaksınız.
                            </p>
                            <ul style="color: #555; line-height: 1.8;">
                                <li>✅ Stand tasarımı ve kurulumu kontrol edilecek</li>
                                <li>✅ Tüm teknik sistemler test edilecek</li>
                                <li>✅ Dijital imza ile teslim onaylanacak</li>
                                <li>✅ Teslim sonrası memnuniyet anketi gönderilecek</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{handover_link}" 
                               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-weight: bold;
                                      display: inline-block;
                                      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                                📝 Teslim Formunu Doldur
                            </a>
                        </div>
                        
                        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #0277bd; font-size: 14px; margin: 0;">
                                <strong>💡 Bilgi:</strong> Teslim formunu onayladıktan sonra size otomatik olarak bir memnuniyet anketi gönderilecektir.
                            </p>
                        </div>
                        
                        <p style="color: #777; font-size: 14px; text-align: center;">
                            Bu teslim formu linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.
                        </p>
                    </div>
                    
                    <div style="background: #333; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">
                            Vitingo CRM | Fuar Stand Üretim ve Tasarım<br>
                            info@quattrostand.com
                        </p>
                    </div>
                </body>
            </html>
            """
        else:
            return f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">🏗️ Your Fair Stand is Ready!</h1>
                    </div>
                    
                    <div style="padding: 30px; background: #f8f9fa;">
                        <p style="font-size: 16px; color: #333;">Dear <strong>{customer_data['contact']}</strong>,</p>
                        
                        <p style="color: #555; line-height: 1.6;">
                            Your fair stand for the <strong>{project_data['name']}</strong> project has been completed and is ready for handover.
                        </p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <h3 style="color: #333; margin-top: 0;">📋 Handover Process:</h3>
                            <p style="color: #555; line-height: 1.8; margin-bottom: 10px;">
                                To receive your stand, please click the link below to complete the handover form.
                                This form confirms that the stand has been delivered complete and in working condition.
                            </p>
                            <ul style="color: #555; line-height: 1.8;">
                                <li>✅ Stand design and installation will be verified</li>
                                <li>✅ All technical systems will be tested</li>
                                <li>✅ Handover will be confirmed with digital signature</li>
                                <li>✅ Satisfaction survey will be sent after handover</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{handover_link}" 
                               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 25px; 
                                      font-weight: bold;
                                      display: inline-block;
                                      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                                📝 Complete Handover Form
                            </a>
                        </div>
                        
                        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #0277bd; font-size: 14px; margin: 0;">
                                <strong>💡 Note:</strong> A satisfaction survey will be automatically sent to you after confirming the handover form.
                            </p>
                        </div>
                        
                        <p style="color: #777; font-size: 14px; text-align: center;">
                            This handover form link has been created specifically for you and is single-use only.
                        </p>
                    </div>
                    
                    <div style="background: #333; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 14px;">
                            Vitingo CRM | Fair Stand Production and Design<br>
                            info@quattrostand.com
                        </p>
                    </div>
                </body>
            </html>
            """

    def _generate_handover_email_text(self, customer_data: dict, project_data: dict, handover_link: str, language: str = 'tr') -> str:
        """Generate plain text content for handover invitation email"""
        if language == 'tr':
            return f"""
            🏗️ Fuar Standınız Hazır!

            Sayın {customer_data['contact']},

            {project_data['name']} projeniz kapsamında hazırlanan fuar standınız tamamlanmış ve teslime hazır haldedir.

            📋 Teslim İşlemi:
            Standınızı teslim almak için aşağıdaki linke tıklayarak teslim formunu doldurunuz.
            Bu form ile standın eksiksiz ve çalışır durumda teslim edildiğini onaylayacaksınız.

            ✅ Stand tasarımı ve kurulumu kontrol edilecek
            ✅ Tüm teknik sistemler test edilecek  
            ✅ Dijital imza ile teslim onaylanacek
            ✅ Teslim sonrası memnuniyet anketi gönderilecek

            Teslim formunu doldurmak için:
            {handover_link}

            💡 Bilgi: Teslim formunu onayladıktan sonra size otomatik olarak bir memnuniyet anketi gönderilecektir.

            Bu teslim formu linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.

            Vitingo CRM | Fuar Stand Üretim ve Tasarım
            info@quattrostand.com
            """
        else:
            return f"""
            🏗️ Your Fair Stand is Ready!

            Dear {customer_data['contact']},

            Your fair stand for the {project_data['name']} project has been completed and is ready for handover.

            📋 Handover Process:
            To receive your stand, please click the link below to complete the handover form.
            This form confirms that the stand has been delivered complete and in working condition.

            ✅ Stand design and installation will be verified
            ✅ All technical systems will be tested
            ✅ Handover will be confirmed with digital signature
            ✅ Satisfaction survey will be sent after handover

            To complete the handover form:
            {handover_link}

            💡 Note: A satisfaction survey will be automatically sent to you after confirming the handover form.

            This handover form link has been created specifically for you and is single-use only.

            Vitingo CRM | Fair Stand Production and Design
            info@quattrostand.com
            """

    def _generate_survey_email_html(self, customer_data: dict, project_data: dict, survey_link: str) -> str:
        """Generate HTML content for survey invitation email"""
        return f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">Değerli Görüşünüz Bizim İçin Önemli!</h1>
                </div>
                
                <div style="padding: 30px; background: #f8f9fa;">
                    <p style="font-size: 16px; color: #333;">Sayın <strong>{customer_data['contact']}</strong>,</p>
                    
                    <p style="color: #555; line-height: 1.6;">
                        <strong>{project_data['fairName']}</strong> fuarı için hazırladığımız stand projenizle ilgili deneyiminizi öğrenmek istiyoruz.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                        <h3 style="color: #333; margin-top: 0;">Proje Detayları:</h3>
                        <ul style="color: #555; line-height: 1.8;">
                            <li><strong>Proje:</strong> {project_data['name']}</li>
                            <li><strong>Fuar:</strong> {project_data['fairName']}</li>
                            <li><strong>Lokasyon:</strong> {project_data['city']}, {project_data['country']}</li>
                            <li><strong>Teslimat Tarihi:</strong> {self._format_date(project_data['deliveryDate'])}</li>
                        </ul>
                    </div>
                    
                    <p style="color: #555; line-height: 1.6;">
                        Anketi tamamlamanız yaklaşık <strong>3-5 dakika</strong> sürecektir. 
                        Görüşleriniz gelecekteki projelerimizi daha da iyileştirmemize yardımcı olacaktır.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{survey_link}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                  color: white; 
                                  padding: 15px 30px; 
                                  text-decoration: none; 
                                  border-radius: 25px; 
                                  font-weight: bold;
                                  display: inline-block;
                                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                            🗳️ Ankete Başla
                        </a>
                    </div>
                    
                    <p style="color: #777; font-size: 14px; text-align: center;">
                        Bu anket linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.
                    </p>
                </div>
                
                <div style="background: #333; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-size: 14px;">
                        Vitingo CRM | Fuar Stand Üretim ve Tasarım<br>
                        info@quattrostand.com
                    </p>
                </div>
            </body>
        </html>
        """

    def _generate_survey_email_text(self, customer_data: dict, project_data: dict, survey_link: str) -> str:
        """Generate plain text content for survey invitation email"""
        return f"""
        Değerli Görüşünüz Bizim İçin Önemli!

        Sayın {customer_data['contact']},

        {project_data['fairName']} fuarı için hazırladığımız stand projenizle ilgili deneyiminizi öğrenmek istiyoruz.

        Proje Detayları:
        - Proje: {project_data['name']}
        - Fuar: {project_data['fairName']} 
        - Lokasyon: {project_data['city']}, {project_data['country']}
        - Teslimat Tarihi: {self._format_date(project_data['deliveryDate'])}

        Anketi tamamlamanız yaklaşık 3-5 dakika sürecektir. Görüşleriniz gelecekteki projelerimizi daha da iyileştirmemize yardımcı olacaktır.

        Ankete başlamak için aşağıdaki linke tıklayın:
        {survey_link}

        Bu anket linki sadece sizin için oluşturulmuştur ve tek kullanımlıktır.

        Vitingo CRM | Fuar Stand Üretim ve Tasarım
        info@quattrostand.com
        """

    def _format_date(self, date_string: str) -> str:
        """Format date string to Turkish locale"""
        try:
            from datetime import datetime
            date_obj = datetime.fromisoformat(date_string)
            return date_obj.strftime("%d.%m.%Y")
        except:
            return date_string

    def _get_current_date(self) -> str:
        """Get current date in Turkish format"""
        from datetime import datetime
        return datetime.now().strftime("%d.%m.%Y %H:%M")
    
    def send_user_email(self, to_email: str, to_name: str, from_email: str, from_name: str, 
                       subject: str, body: str, cc: str = "", bcc: str = "", attachments: list = None) -> dict:
        """Send email from user to user via CRM system"""
        try:
            if not self.sg:
                logger.error("SendGrid client not initialized - missing API key")
                return {"success": False, "error": "Email service not configured"}

            # Create HTML content for user email
            html_content = self._generate_user_email_html(
                to_name=to_name,
                from_name=from_name,
                subject=subject,
                body=body
            )
            
            # Create plain text content
            plain_content = f"""
{subject}

{body}

---
Gönderen: {from_name}
E-posta: {from_email}
Vitingo CRM Sistemi
            """.strip()

            # Create SendGrid mail object
            message = Mail(
                from_email=From(self.sender_email, f"Vitingo CRM - {from_name}"),
                to_emails=To(to_email, to_name),
                subject=Subject(subject),
                html_content=HtmlContent(html_content),
                plain_text_content=PlainTextContent(plain_content)
            )
            
            # Add CC if provided
            if cc:
                cc_emails = [email.strip() for email in cc.split(',') if email.strip()]
                for cc_email in cc_emails:
                    message.add_cc(To(cc_email))
            
            # Add BCC if provided
            if bcc:
                bcc_emails = [email.strip() for email in bcc.split(',') if email.strip()]
                for bcc_email in bcc_emails:
                    message.add_bcc(To(bcc_email))
            
            # Add reply-to
            message.reply_to = From(from_email, from_name)
            
            # Handle attachments
            if attachments:
                from sendgrid.helpers.mail import Attachment, FileContent, FileName, FileType, Disposition
                import base64
                
                for attachment in attachments:
                    try:
                        # Extract base64 data (remove data:type;base64, prefix)
                        file_data = attachment['data']
                        if file_data.startswith('data:'):
                            file_data = file_data.split(',')[1]
                        
                        # Create attachment
                        attached_file = Attachment(
                            FileContent(file_data),
                            FileName(attachment['name']),
                            FileType(attachment['type']),
                            Disposition('attachment')
                        )
                        message.add_attachment(attached_file)
                        logger.info(f"Added attachment: {attachment['name']}")
                        
                    except Exception as attach_error:
                        logger.error(f"Error adding attachment {attachment.get('name', 'unknown')}: {str(attach_error)}")

            # Send email
            response = self.sg.send(message)
            
            logger.info(f"User email sent from {from_email} to {to_email} - Status: {response.status_code}")
            
            if response.status_code == 202:
                return {
                    "success": True,
                    "message": "Email sent successfully",
                    "message_id": response.headers.get('X-Message-Id')
                }
            else:
                logger.error(f"SendGrid returned unexpected status: {response.status_code}")
                return {
                    "success": False,
                    "error": f"Email sending failed with status: {response.status_code}"
                }

        except Exception as e:
            logger.error(f"Error sending user email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_user_email_html(self, to_name: str, from_name: str, subject: str, body: str) -> str:
        """Generate HTML content for user email"""
        return f"""
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{subject}</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .email-header {{
                    background: linear-gradient(135deg, #3B82F6, #1E40AF);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }}
                .email-header h1 {{
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }}
                .email-body {{
                    padding: 30px;
                }}
                .email-body h2 {{
                    color: #1E40AF;
                    margin-top: 0;
                }}
                .email-content {{
                    white-space: pre-wrap;
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 6px;
                    border-left: 4px solid #3B82F6;
                    margin: 20px 0;
                }}
                .email-signature {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                }}
                .email-footer {{
                    background-color: #f8fafc;
                    padding: 20px;
                    text-align: center;
                    font-size: 14px;
                    color: #64748b;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="email-header">
                    <h1>Vitingo CRM</h1>
                </div>
                
                <div class="email-body">
                    <h2>Merhaba {to_name},</h2>
                    <p>{from_name} size bir mesaj gönderdi:</p>
                    
                    <div class="email-content">
                        {body}
                    </div>
                    
                    <div class="email-signature">
                        <p><strong>Gönderen:</strong></p>
                        <p>
                            <strong>{from_name}</strong><br>
                            Vitingo CRM Sistemi<br>
                            Bu e-posta Vitingo CRM sistemi üzerinden gönderilmiştir.
                        </p>
                    </div>
                </div>
                
                <div class="email-footer">
                    <p>Bu e-posta Vitingo CRM sistemi tarafından gönderilmiştir.</p>
                    <p>© {self._get_current_date().split(' ')[0].split('.')[2]} Vitingo CRM - Tüm hakları saklıdır</p>
                </div>
            </div>
        </body>
        </html>
        """

    def send_email(self, to_email: str, subject: str, html_content: str, plain_content: Optional[str] = None) -> dict:
        """Generic send email method for any email content"""
        try:
            if not self.sg:
                logger.error("SendGrid client not initialized - missing API key")
                return {"success": False, "error": "Email service not configured"}

            # Create SendGrid mail object
            message = Mail(
                from_email=From(self.sender_email, "Vitingo CRM - Quattro Stand"),
                to_emails=To(to_email),
                subject=Subject(subject),
                html_content=HtmlContent(html_content)
            )
            
            # Add plain text content if provided
            if plain_content:
                message.plain_text_content = PlainTextContent(plain_content)

            # Send email
            response = self.sg.send(message)
            
            logger.info(f"Email sent to {to_email} - Status: {response.status_code}")
            
            return {
                "success": True,
                "status_code": response.status_code,
                "message": "Email sent successfully"
            }

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Global email service instance
email_service = EmailService()