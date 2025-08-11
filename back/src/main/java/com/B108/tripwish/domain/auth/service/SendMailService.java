package com.B108.tripwish.domain.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SendMailService {

  private final JavaMailSender mailSender;

  @Value("${email.id}")
  private String fromId;

  @Async("mailExecutor")
  public void sendEmail(String to, String subject, String content) {
    MimeMessagePreparator messagePreparator =
        mimeMessage -> {
          MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
          helper.setFrom(fromId); // 반드시 from 설정 포함
          helper.setTo(to);
          helper.setSubject(subject);
          helper.setText(content, true);
        };
    mailSender.send(messagePreparator);
  }
}
