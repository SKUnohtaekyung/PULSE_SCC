package kr.co.scc.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SccApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(SccApiApplication.class, args);
	}

}
