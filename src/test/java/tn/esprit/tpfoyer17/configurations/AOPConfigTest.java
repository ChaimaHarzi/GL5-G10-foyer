package tn.esprit.tpfoyer17.configurations;

import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import java.time.Clock;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit test for the timing aspect: the clock is a Mockito mock that moves 150 ms forward
 * between the start and the end of the intercepted method (no real waiting),
 * and the logged duration is read from the console output.
 */
@ExtendWith(OutputCaptureExtension.class)
class AOPConfigTest {

    @Test
    void temps_logsTheElapsedTimeInMilliseconds(CapturedOutput output) throws Throwable {
        Clock clock = mock(Clock.class);
        when(clock.millis()).thenReturn(1000L, 1150L);
        ProceedingJoinPoint pjp = mock(ProceedingJoinPoint.class);
        when(pjp.proceed()).thenReturn("resultat");

        Object result = new AOPConfig(clock).temps(pjp);

        assertEquals("resultat", result);
        Matcher m = Pattern.compile("temps d'execution = (\\d+)").matcher(output.getOut());
        assertTrue(m.find(), "duration not logged");
        assertEquals(150, Long.parseLong(m.group(1)));
    }
}
