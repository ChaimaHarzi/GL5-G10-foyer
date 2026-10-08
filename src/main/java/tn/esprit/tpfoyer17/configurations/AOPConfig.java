package tn.esprit.tpfoyer17.configurations;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import java.util.Date;

@Component
@Aspect
@Slf4j
public class AOPConfig {

	@Around("execution(* tn.esprit.tpfoyer17.services.ReservationService.ajouterReservation(..))")
	public Object temps(ProceedingJoinPoint pjp) throws Throwable {
		Date start = new Date();
		Object obj = pjp.proceed();
		int time = new Date().compareTo(start);
		log.info("temps d'execution = "+time);
		return obj;
	}


}