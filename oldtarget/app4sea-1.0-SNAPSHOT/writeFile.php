<?php
    $NAME = $_POST['F'];
    $HANDLE = fopen($NAME, 'w') or die ('CANT OPEN FILE');
    fwrite($HANDLE,$_POST['D']);
    fclose($HANDLE);
    echo '<p>Have written '+$NAME+' to disk</p>';
?>