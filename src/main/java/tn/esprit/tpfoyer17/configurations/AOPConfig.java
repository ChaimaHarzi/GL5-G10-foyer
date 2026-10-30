package tn.esprit.tpfoyer17.configurations;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import java.time.Clock;

@Component
@Aspect
@Slf4j
public class AOPConfig {

	// Time source: the system clock in production, a fixed clock in tests
	private final Clock clock;

	public AOPConfig() {
		this(Clock.systemUTC());
	}

	AOPConfig(Clock clock) {
		this.clock = clock;
	}

	@Around("execution(* tn.esprit.tpfoyer17.services.ReservationService.ajouterReservation(..))")
	public Object temps(ProceedingJoinPoint pjp) throws Throwable {
		long start = clock.millis();
		Object obj = pjp.proceed();
		// elapsed time in ms (Date.compareTo only returns -1, 0 or 1)
		long time = clock.millis() - start;
		log.info("temps d'execution = {} ms", time);
		return obj;
	}


}