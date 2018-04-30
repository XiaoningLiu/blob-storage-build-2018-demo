FROM openjdk:8

MAINTAINER Michael Hauss <mihauss@microsoft.com>
 
COPY out/artifacts/ /opt/start/.

WORKDIR /opt/start

ENTRYPOINT ["java", "-jar", "download-new.jar"]