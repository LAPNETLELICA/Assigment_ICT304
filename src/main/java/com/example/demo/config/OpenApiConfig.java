package com.example.demo.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Système Bancaire API")
                        .version("1.0")
                        .description("Interface Swagger pour tester l'API de gestion des comptes, dépôts et retraits.")
                        .contact(new Contact()
                                .name("Support API")
                                .email("support@exemple.com")));
    }
}
