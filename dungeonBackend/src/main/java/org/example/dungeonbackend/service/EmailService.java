package org.example.dungeonbackend.service;

import org.example.dungeonbackend.model.JobRun;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Value("${app.alert.recipient}")
    private String recipient;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendConsecutiveFailureAlert(JobRun run) {
        if (mailSender == null) {
            System.out.println("[EMAIL] Mail není nakonfigurován. Upozornění by bylo odesláno na " + recipient);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(recipient);
            helper.setSubject("Upozornění: Agregace dat selhala dvakrát za sebou");
            helper.setText(buildEmailBody(run), false);
            mailSender.send(message);
            System.out.println("[EMAIL] Upozornění odesláno na " + recipient);
        } catch (Exception e) {
            System.err.println("[EMAIL] Chyba při odesílání upozornění: " + e.getMessage());
        }
    }

    private String buildEmailBody(JobRun run) {
        String start = run.getStartedAt() != null ? run.getStartedAt().format(FMT) : "neznámý";
        String end = run.getFinishedAt() != null ? run.getFinishedAt().format(FMT) : "neznámý";
        String duration = run.getDurationSeconds() != null ? run.getDurationSeconds() + " s" : "neznámá";
        String error = run.getErrorMessage() != null ? run.getErrorMessage() : "žádná zpráva";

        return "Dobrý den,\n\n"
                + "toto je automatické upozornění systému Dungeon Dashboard.\n\n"
                + "Agregační pipeline selhala dvakrát za sebou.\n\n"
                + "Podrobnosti posledního selhání:\n"
                + "  ID běhu:          " + run.getId() + "\n"
                + "  Čas spuštění:     " + start + "\n"
                + "  Čas ukončení:     " + end + "\n"
                + "  Trvání:           " + duration + "\n"
                + "  Chybová zpráva:   " + error + "\n\n"
                + "Prosím zkontrolujte stav systému a zajistěte obnovení provozu.\n\n"
                + "S pozdravem,\n"
                + "Dungeon Dashboard Monitor";
    }
}
