package tn.esprit.tpfoyer17.configurations;

import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test for the timing aspect: the intercepted method is a Mockito mock
 * that takes about 100 ms, and the logged duration is read from the console output.
 */
@ExtendWith(OutputCaptureExtension.class)
class AOPConfigTest {

    @Test
    void temps_logsTheRealDurationInMilliseconds(CapturedOutput output) throws Throwable {
        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        when(pjp.proceed()).thenAnswer(inv -> {
            Thread.sleep(100);
            return "resultat";
        });

        Object result = new AOPConfig().temps(pjp);

        assertEquals("resultat", result);
        Matcher m = Pattern.compile("temps d'execution = (\\d+)").matcher(output.getOut());
        assertTrue(m.find(), "duration not logged");
        assertTrue(Long.parseLong(m.group(1)) >= 100, "logged duration: " + m.group(1));
    }
}
