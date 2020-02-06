FROM selenium/standalone-chrome
LABEL authors="Baldur van Lew"
# set rw permissions for everyone
RUN echo "umask 000" >> ~/.bashrc
RUN echo "umask 000" >> ~/.profile

RUN sudo sed -i '1i umask 000\n' /root/.profile
RUN sudo sed -i '1i umask 000\n' /etc/profile

RUN umask 000
RUN sudo sed -i '4i umask 000\n' /opt/bin/start-selenium-standalone.sh

RUN /bin/sh . /root/.profile
