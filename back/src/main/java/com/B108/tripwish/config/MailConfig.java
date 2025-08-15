 package com.B108.tripwish.config;

 import java.util.Properties;

 import org.springframework.beans.factory.annotation.Value;
 import org.springframework.context.annotation.Bean;
 import org.springframework.context.annotation.Configuration;
 import org.springframework.mail.javamail.JavaMailSender;
 import org.springframework.mail.javamail.JavaMailSenderImpl;

 @Configuration
 public class MailConfig {

   @Value("${email.id}")
   private String fromId;

   @Value("${email.password}")
   private String password;

   @Bean
   public JavaMailSender javaMailSender() {
     JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

     mailSender.setHost("smtp.gmail.com");
     mailSender.setPort(465);
     mailSender.setUsername(fromId);
     mailSender.setPassword(password);

     Properties props = mailSender.getJavaMailProperties();
     props.put("mail.transport.protocol", "smtp");
     props.put("mail.smtp.auth", "true");
     props.put("mail.smtp.ssl.enable", "true");
     props.put("mail.debug", "true");
     return mailSender;
   }
 }
